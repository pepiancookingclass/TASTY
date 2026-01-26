-- 💰 ACTUALIZAR TARIFAS DE TODOS LOS CREADORES
-- Ejecutar en Supabase SQL Editor

-- 1. Ver creadores actuales ANTES del cambio
SELECT 
  email,
  name,
  creator_base_delivery_fee,
  creator_per_km_fee,
  creator_delivery_radius
FROM users 
WHERE 'creator' = ANY(roles)
ORDER BY email;

-- 2. Actualizar TODOS los creadores con nuevas tarifas
UPDATE users 
SET 
  creator_base_delivery_fee = 25.00,  -- Q25 base (era Q15)
  creator_per_km_fee = 3.00,          -- Q3 por km (era Q2)
  updated_at = NOW()
WHERE 'creator' = ANY(roles);

-- 3. Ver creadores DESPUÉS del cambio para verificar
SELECT 
  email,
  name,
  creator_base_delivery_fee,
  creator_per_km_fee,
  creator_delivery_radius,
  'ACTUALIZADO' as status
FROM users 
WHERE 'creator' = ANY(roles)
ORDER BY email;

-- 4. Contar cuántos creadores se actualizaron
SELECT 
  COUNT(*) as total_creadores_actualizados,
  'Q25.00' as nueva_tarifa_base,
  'Q3.00' as nueva_tarifa_por_km
FROM users 
WHERE 'creator' = ANY(roles) 
  AND creator_base_delivery_fee = 25.00 
  AND creator_per_km_fee = 3.00;

