-- =====================================================
-- SISTEMA DE ENTREGA POR VEHÍCULO (AUTO vs MOTO)
-- Implementa tarifas diferenciadas según tipo de producto
-- =====================================================

-- 1. Agregar columnas de tarifas por vehículo a tabla users (creadores)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS creator_base_delivery_fee_auto DECIMAL(8, 2) DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS creator_per_km_fee_auto DECIMAL(8, 2) DEFAULT 3.00,
ADD COLUMN IF NOT EXISTS creator_base_delivery_fee_moto DECIMAL(8, 2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS creator_per_km_fee_moto DECIMAL(8, 2) DEFAULT 2.00;

-- 2. Migrar tarifas existentes a campos moto (mantener compatibilidad)
UPDATE users
SET 
  creator_base_delivery_fee_moto = COALESCE(creator_base_delivery_fee, 15.00),
  creator_per_km_fee_moto = COALESCE(creator_per_km_fee, 2.00)
WHERE creator_base_delivery_fee IS NOT NULL;

-- 3. Agregar columna de vehículo a productos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS delivery_vehicle TEXT DEFAULT 'moto' 
CHECK (delivery_vehicle IN ('moto', 'auto'));

-- 4. Backfill productos existentes a moto
UPDATE products SET delivery_vehicle = 'moto' WHERE delivery_vehicle IS NULL;

-- 5. Agregar columna de vehículo a order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS delivery_vehicle TEXT DEFAULT 'moto';

-- 6. Eliminar función vieja y recrear con soporte de vehículo
DROP FUNCTION IF EXISTS calculate_creator_delivery_fee(UUID, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS calculate_creator_delivery_fee(UUID, DECIMAL, DECIMAL, TEXT);

CREATE OR REPLACE FUNCTION calculate_creator_delivery_fee(
  creator_uuid UUID,
  client_latitude DECIMAL(10, 8),
  client_longitude DECIMAL(11, 8),
  vehicle TEXT DEFAULT 'moto'
)
RETURNS TABLE (
  delivery_fee DECIMAL(8, 2),
  distance_km DECIMAL(8, 2),
  creator_location TEXT,
  is_within_radius BOOLEAN,
  vehicle_used TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  creator_location RECORD;
  creator_settings RECORD;
  distance_km_calc DECIMAL(8, 2);
  calculated_fee DECIMAL(8, 2);
  base_fee DECIMAL(8, 2);
  per_km_fee DECIMAL(8, 2);
BEGIN
  -- Obtener ubicación actual del creador
  SELECT * INTO creator_location
  FROM get_creator_current_location(creator_uuid)
  LIMIT 1;

  IF NOT FOUND OR creator_location.latitude IS NULL THEN
    -- Sin ubicación del creador, usar tarifa base según vehículo
    IF vehicle = 'auto' THEN
      RETURN QUERY SELECT 
        25.00::DECIMAL(8, 2) as delivery_fee,
        0.00::DECIMAL(8, 2) as distance_km,
        'Ubicación no configurada'::TEXT as creator_location,
        false as is_within_radius,
        vehicle::TEXT as vehicle_used;
    ELSE
      RETURN QUERY SELECT 
        15.00::DECIMAL(8, 2) as delivery_fee,
        0.00::DECIMAL(8, 2) as distance_km,
        'Ubicación no configurada'::TEXT as creator_location,
        false as is_within_radius,
        vehicle::TEXT as vehicle_used;
    END IF;
    RETURN;
  END IF;

  -- Obtener configuración del creador
  SELECT 
    creator_delivery_radius,
    COALESCE(creator_base_delivery_fee_auto, 25.00) as base_auto,
    COALESCE(creator_per_km_fee_auto, 3.00) as per_km_auto,
    COALESCE(creator_base_delivery_fee_moto, creator_base_delivery_fee, 15.00) as base_moto,
    COALESCE(creator_per_km_fee_moto, creator_per_km_fee, 2.00) as per_km_moto
  INTO creator_settings
  FROM users
  WHERE id = creator_uuid;

  -- Seleccionar tarifas según vehículo
  IF vehicle = 'auto' THEN
    base_fee := creator_settings.base_auto;
    per_km_fee := creator_settings.per_km_auto;
  ELSE
    base_fee := creator_settings.base_moto;
    per_km_fee := creator_settings.per_km_moto;
  END IF;

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
      false as is_within_radius,
      vehicle::TEXT as vehicle_used;
    RETURN;
  END IF;

  -- Calcular tarifa
  calculated_fee := base_fee;
  
  -- Agregar costo por kilómetro (después de los primeros 3km gratis)
  IF distance_km_calc > 3 THEN
    calculated_fee := calculated_fee + ((distance_km_calc - 3) * per_km_fee);
  END IF;

  RETURN QUERY SELECT 
    calculated_fee as delivery_fee,
    distance_km_calc as distance_km,
    creator_location.address as creator_location,
    true as is_within_radius,
    vehicle::TEXT as vehicle_used;
END;
$$;

-- 7. Eliminar función vieja y recrear con soporte de vehículo por creador
DROP FUNCTION IF EXISTS calculate_order_total_delivery(JSONB, DECIMAL, DECIMAL);

CREATE OR REPLACE FUNCTION calculate_order_total_delivery(
  order_items JSONB, -- [{"product_id": "uuid", "creator_id": "uuid", "quantity": 1, "delivery_vehicle": "moto"}]
  client_latitude DECIMAL(10, 8),
  client_longitude DECIMAL(11, 8)
)
RETURNS TABLE (
  creator_id UUID,
  creator_name TEXT,
  delivery_fee DECIMAL(8, 2),
  distance_km DECIMAL(8, 2),
  is_within_radius BOOLEAN,
  vehicle TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  creator_uuid UUID;
  delivery_calc RECORD;
  creator_vehicle TEXT;
  items_for_creator JSONB[];
BEGIN
  -- Agrupar items por creador y determinar vehículo
  FOR creator_uuid IN 
    SELECT DISTINCT (elem->>'creator_id')::UUID
    FROM jsonb_array_elements(order_items) elem
  LOOP
    -- Determinar vehículo para este creador: si al menos un producto requiere auto, usar auto
    SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements(order_items) elem 
          WHERE (elem->>'creator_id')::UUID = creator_uuid 
          AND COALESCE(elem->>'delivery_vehicle', 'moto') = 'auto'
        ) THEN 'auto'
        ELSE 'moto'
      END
    INTO creator_vehicle;
    
    -- Calcular delivery para este creador con el vehículo determinado
    SELECT * INTO delivery_calc
    FROM calculate_creator_delivery_fee(creator_uuid, client_latitude, client_longitude, creator_vehicle)
    LIMIT 1;
    
    -- Obtener nombre del creador y retornar resultado
    RETURN QUERY
    SELECT 
      creator_uuid,
      u.name,
      delivery_calc.delivery_fee,
      delivery_calc.distance_km,
      delivery_calc.is_within_radius,
      creator_vehicle
    FROM users u
    WHERE u.id = creator_uuid;
  END LOOP;
END;
$$;

-- =====================================================
-- COMENTARIOS Y USO:
-- =====================================================

/*
CAMBIOS IMPLEMENTADOS:

1. NUEVAS COLUMNAS EN USERS (creadores):
   - creator_base_delivery_fee_auto: Tarifa base para entrega en auto (default Q25)
   - creator_per_km_fee_auto: Costo por km en auto (default Q3)
   - creator_base_delivery_fee_moto: Tarifa base para moto (default Q15)
   - creator_per_km_fee_moto: Costo por km en moto (default Q2)

2. NUEVA COLUMNA EN PRODUCTS:
   - delivery_vehicle: 'moto' (default) o 'auto'

3. NUEVA COLUMNA EN ORDER_ITEMS:
   - delivery_vehicle: Guarda el vehículo usado al momento del pedido

4. FUNCIONES ACTUALIZADAS:
   - calculate_creator_delivery_fee(): Ahora acepta parámetro 'vehicle'
   - calculate_order_total_delivery(): Determina vehículo por creador según productos

5. LÓGICA:
   - Si un creador tiene al menos un producto que requiere auto, 
     toda su entrega se cobra con tarifas de auto
   - Si todos los productos son moto, se usa tarifa de moto

PRÓXIMOS PASOS:
1. Ejecutar este SQL en Supabase
2. Agregar selector de vehículo en formulario de producto (frontend)
3. Actualizar checkout para enviar vehicle en el breakdown
4. Actualizar emails/WhatsApp para mostrar vehículo
*/
