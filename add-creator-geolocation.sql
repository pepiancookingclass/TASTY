-- =====================================================
-- AGREGAR GEOLOCALIZACIÓN A CREADORES
-- Campos para ubicación base y temporal del creador
-- =====================================================

-- 1. Agregar campos de geolocalización a tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS creator_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS creator_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS creator_address TEXT,
ADD COLUMN IF NOT EXISTS creator_delivery_radius INTEGER DEFAULT 20, -- km máximo de entrega
ADD COLUMN IF NOT EXISTS creator_base_delivery_fee DECIMAL(8, 2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS creator_per_km_fee DECIMAL(8, 2) DEFAULT 2.00;

-- 2. Agregar tabla para ubicaciones temporales del creador
CREATE TABLE IF NOT EXISTS creator_temporary_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT, -- 'delivery_day', 'special_event', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_creator_temp_locations_creator_id ON creator_temporary_locations(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_temp_locations_active ON creator_temporary_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_creator_temp_locations_valid_until ON creator_temporary_locations(valid_until);

-- 3. Función para obtener ubicación actual del creador
CREATE OR REPLACE FUNCTION get_creator_current_location(creator_uuid UUID)
RETURNS TABLE (
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  is_temporary BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  temp_location RECORD;
  base_location RECORD;
BEGIN
  -- Buscar ubicación temporal activa
  SELECT 
    ctl.latitude,
    ctl.longitude,
    ctl.address,
    true as is_temporary
  INTO temp_location
  FROM creator_temporary_locations ctl
  WHERE ctl.creator_id = creator_uuid
    AND ctl.is_active = true
    AND ctl.valid_until > NOW()
  ORDER BY ctl.created_at DESC
  LIMIT 1;

  -- Si hay ubicación temporal, usarla
  IF FOUND THEN
    RETURN QUERY SELECT 
      temp_location.latitude,
      temp_location.longitude,
      temp_location.address,
      temp_location.is_temporary;
    RETURN;
  END IF;

  -- Si no, usar ubicación base
  SELECT 
    u.creator_latitude,
    u.creator_longitude,
    u.creator_address,
    false as is_temporary
  INTO base_location
  FROM users u
  WHERE u.id = creator_uuid;

  IF FOUND AND base_location.creator_latitude IS NOT NULL THEN
    RETURN QUERY SELECT 
      base_location.creator_latitude,
      base_location.creator_longitude,
      base_location.creator_address,
      base_location.is_temporary;
  END IF;

  -- Si no hay ubicación, retornar null
  RETURN;
END;
$$;

-- 4. Función para calcular delivery entre creador y cliente
CREATE OR REPLACE FUNCTION calculate_creator_delivery_fee(
  creator_uuid UUID,
  client_latitude DECIMAL(10, 8),
  client_longitude DECIMAL(11, 8)
)
RETURNS TABLE (
  delivery_fee DECIMAL(8, 2),
  distance_km DECIMAL(8, 2),
  creator_location TEXT,
  is_within_radius BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  creator_location RECORD;
  creator_settings RECORD;
  distance_km_calc DECIMAL(8, 2);
  calculated_fee DECIMAL(8, 2);
BEGIN
  -- Obtener ubicación actual del creador
  SELECT * INTO creator_location
  FROM get_creator_current_location(creator_uuid)
  LIMIT 1;

  IF NOT FOUND OR creator_location.latitude IS NULL THEN
    -- Sin ubicación del creador, usar tarifa base
    RETURN QUERY SELECT 
      15.00::DECIMAL(8, 2) as delivery_fee,
      0.00::DECIMAL(8, 2) as distance_km,
      'Ubicación no configurada'::TEXT as creator_location,
      false as is_within_radius;
    RETURN;
  END IF;

  -- Obtener configuración del creador
  SELECT 
    creator_delivery_radius,
    creator_base_delivery_fee,
    creator_per_km_fee
  INTO creator_settings
  FROM users
  WHERE id = creator_uuid;

  -- Calcular distancia usando fórmula de Haversine
  distance_km_calc := (
    6371 * acos(
      cos(radians(creator_location.latitude)) * 
      cos(radians(client_latitude)) * 
      cos(radians(client_longitude) - radians(creator_location.longitude)) + 
      sin(radians(creator_location.latitude)) * 
      sin(radians(client_latitude))
    )
  )::DECIMAL(8, 2);

  -- Verificar si está dentro del radio de entrega
  IF distance_km_calc > creator_settings.creator_delivery_radius THEN
    RETURN QUERY SELECT 
      0.00::DECIMAL(8, 2) as delivery_fee,
      distance_km_calc as distance_km,
      creator_location.address as creator_location,
      false as is_within_radius;
    RETURN;
  END IF;

  -- Calcular tarifa
  calculated_fee := creator_settings.creator_base_delivery_fee;
  
  -- Agregar costo por kilómetro (después de los primeros 3km gratis)
  IF distance_km_calc > 3 THEN
    calculated_fee := calculated_fee + ((distance_km_calc - 3) * creator_settings.creator_per_km_fee);
  END IF;

  RETURN QUERY SELECT 
    calculated_fee as delivery_fee,
    distance_km_calc as distance_km,
    creator_location.address as creator_location,
    true as is_within_radius;
END;
$$;

-- 5. Función para obtener delivery total de un pedido (multi-creador)
CREATE OR REPLACE FUNCTION calculate_order_total_delivery(
  order_items JSONB, -- [{"product_id": "uuid", "creator_id": "uuid", "quantity": 1}]
  client_latitude DECIMAL(10, 8),
  client_longitude DECIMAL(11, 8)
)
RETURNS TABLE (
  creator_id UUID,
  creator_name TEXT,
  delivery_fee DECIMAL(8, 2),
  distance_km DECIMAL(8, 2),
  is_within_radius BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  creator_uuid UUID;
  delivery_calc RECORD;
BEGIN
  -- Obtener creadores únicos del pedido
  FOR item IN SELECT DISTINCT jsonb_array_elements(order_items)
  LOOP
    creator_uuid := (item->>'creator_id')::UUID;
    
    -- Calcular delivery para este creador
    SELECT * INTO delivery_calc
    FROM calculate_creator_delivery_fee(creator_uuid, client_latitude, client_longitude)
    LIMIT 1;
    
    -- Obtener nombre del creador
    RETURN QUERY
    SELECT 
      creator_uuid,
      u.name,
      delivery_calc.delivery_fee,
      delivery_calc.distance_km,
      delivery_calc.is_within_radius
    FROM users u
    WHERE u.id = creator_uuid;
  END LOOP;
END;
$$;

-- =====================================================
-- COMENTARIOS Y USO:
-- =====================================================

/*
FUNCIONALIDADES CREADAS:

1. CAMPOS NUEVOS EN USERS:
   - creator_latitude/longitude: Ubicación base del creador
   - creator_address: Dirección legible
   - creator_delivery_radius: Radio máximo de entrega (km)
   - creator_base_delivery_fee: Tarifa base
   - creator_per_km_fee: Costo por km adicional

2. TABLA creator_temporary_locations:
   - Ubicaciones temporales del creador
   - Con fecha de expiración
   - Para casos especiales (entregas desde otro lugar)

3. FUNCIONES:
   - get_creator_current_location(): Ubicación actual (temporal o base)
   - calculate_creator_delivery_fee(): Calcular delivery creador-cliente
   - calculate_order_total_delivery(): Delivery total para pedido multi-creador

4. LÓGICA:
   - Primero busca ubicación temporal activa
   - Si no, usa ubicación base
   - Calcula distancia real con Haversine
   - Verifica radio de entrega
   - Calcula tarifa personalizada por creador

PRÓXIMOS PASOS:
1. Ejecutar este SQL
2. Actualizar perfil de creador para configurar ubicación
3. Actualizar checkout para usar nuevas funciones
4. Probar con múltiples creadores
*/
