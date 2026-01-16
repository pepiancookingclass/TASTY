-- 🏗️ CONFIGURAR UBICACIÓN DEL CREADOR
-- Ejecutar en Supabase SQL Editor

-- Actualizar ubicación del creador a Guatemala City (por defecto)
UPDATE users 
SET 
  creator_latitude = 14.6349,  -- Guatemala City
  creator_longitude = -90.5069, -- Guatemala City
  creator_address = 'Guatemala City, Guatemala',
  creator_base_delivery_fee = 25.00,  -- ✅ NUEVO: Q25 base
  creator_per_km_fee = 3.00,          -- ✅ NUEVO: Q3 por km extra
  updated_at = NOW()
WHERE email = 'ruajhostal@gmail.com';

-- Verificar que se actualizó correctamente
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
