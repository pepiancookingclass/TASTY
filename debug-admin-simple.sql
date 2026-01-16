-- DIAGNÓSTICO SIMPLE DEL USUARIO ADMIN
-- Ejecutar en Supabase SQL Editor

-- 1. ¿Existe en auth.users?
SELECT 
  'EXISTE en auth.users' as estado,
  id,
  email,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- 2. ¿Los IDs coinciden?
SELECT 
  'COMPARACIÓN DE IDs' as estado,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs COINCIDEN'
    WHEN au.id IS NULL THEN '❌ NO EXISTE EN AUTH.USERS'
    WHEN pu.id IS NULL THEN '❌ NO EXISTE EN PUBLIC.USERS'
    ELSE '❌ IDs DIFERENTES - PROBLEMA GRAVE'
  END as diagnostico
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'pepiancookingclass@gmail.com' 
   OR pu.email = 'pepiancookingclass@gmail.com';

-- 3. Resumen del problema
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'pepiancookingclass@gmail.com') 
    THEN '✅ Usuario existe en auth.users'
    ELSE '❌ Usuario NO existe en auth.users - ESTE ES EL PROBLEMA'
  END as diagnostico_final;



