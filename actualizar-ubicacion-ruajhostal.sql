-- 📍 ACTUALIZAR UBICACIÓN REAL DE RUAJHOSTAL
-- Ejecutar en Supabase SQL Editor

-- Actualizar con ubicación real en la ciudad (ejemplo: Zona 10, Guatemala)
UPDATE users 
SET 
  creator_latitude = 14.6067,   -- Zona 10, Guatemala City (ejemplo)
  creator_longitude = -90.5134, -- Zona 10, Guatemala City (ejemplo)
  creator_address = 'Zona 10, Guatemala City, Guatemala',
  creator_delivery_radius = 25,  -- 25km radio (más realista para ciudad)
  creator_base_delivery_fee = 25.00,
  creator_per_km_fee = 3.00,
  updated_at = NOW()
WHERE email = 'ruajhostal@gmail.com';

-- Verificar cambios aplicados
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

-- Probar cálculo con ubicación cercana (ejemplo: Zona 9)
SELECT 
  'Prueba Zona 9' as test_location,
  delivery_fee,
  distance_km,
  creator_location,
  is_within_radius
FROM calculate_creator_delivery_fee(
  '31f72af9-2f48-4cbc-928d-4b88902b44c4'::UUID,  -- ID ruajhostal
  14.6021::DECIMAL(10, 8),  -- Zona 9 lat
  -90.5156::DECIMAL(11, 8)  -- Zona 9 lng
);

-- Probar cálculo con ubicación lejana (ejemplo: Antigua)
SELECT 
  'Prueba Antigua' as test_location,
  delivery_fee,
  distance_km,
  creator_location,
  is_within_radius
FROM calculate_creator_delivery_fee(
  '31f72af9-2f48-4cbc-928d-4b88902b44c4'::UUID,  -- ID ruajhostal
  14.5586::DECIMAL(10, 8),  -- Antigua lat
  -90.7339::DECIMAL(11, 8)  -- Antigua lng
);
