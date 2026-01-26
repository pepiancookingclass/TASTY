-- 🔍 SECCIÓN 3: DATOS DE TU USUARIO ESPECÍFICO
SELECT 
  id,
  email,
  name,
  -- Ubicación del usuario como cliente
  address_street,
  address_city,
  address_state,
  address_zip,
  address_country,
  
  -- Ubicación del usuario como creador
  creator_latitude,
  creator_longitude,
  creator_address,
  creator_delivery_radius,
  creator_base_delivery_fee,
  creator_per_km_fee,
  
  created_at,
  updated_at
FROM users 
WHERE email = 'ruajhostal@gmail.com';

