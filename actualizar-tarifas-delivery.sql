-- 💰 ACTUALIZAR TARIFAS DE DELIVERY
-- Ejecutar en Supabase SQL Editor para aplicar cambios

-- 1. Actualizar función SQL con nueva tarifa base Q25
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
    -- Sin ubicación del creador, usar tarifa base Q25
    RETURN QUERY SELECT 
      25.00::DECIMAL(8, 2) as delivery_fee,
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

-- 2. Actualizar configuración del usuario existente
UPDATE users 
SET 
  creator_base_delivery_fee = 25.00,  -- ✅ Q25 base (era Q15)
  creator_per_km_fee = 3.00,          -- ✅ Q3 por km (era Q2)
  updated_at = NOW()
WHERE email = 'ruajhostal@gmail.com';

-- 3. Verificar cambios aplicados
SELECT 
  email,
  creator_latitude,
  creator_longitude,
  creator_address,
  creator_delivery_radius,
  creator_base_delivery_fee,
  creator_per_km_fee
FROM users 
WHERE email = 'ruajhostal@gmail.com';

-- 4. Probar función con ubicación de ejemplo
SELECT * FROM calculate_creator_delivery_fee(
  '31f72af9-2f48-4cbc-928d-4b88902b44c4'::UUID,  -- ID del usuario
  14.8446::DECIMAL(10, 8),  -- Lat cliente (ejemplo)
  -91.5232::DECIMAL(11, 8)  -- Lng cliente (ejemplo)
);
