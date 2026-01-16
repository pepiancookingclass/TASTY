-- =====================================================
-- INVESTIGAR USUARIO ADMIN: pepiancookingclass@gmail.com
-- =====================================================

-- 1. Ver datos del usuario admin en auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  updated_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- 2. Ver datos del usuario admin en public.users
SELECT 
  id,
  email,
  name,
  roles,
  created_at,
  updated_at,
  profile_picture_url,
  skills,
  workspace_photos,
  phone,
  address_street,
  address_city,
  address_country
FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- 3. Verificar si existe en ambas tablas
SELECT 
  'auth.users' as tabla,
  COUNT(*) as registros
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'
UNION ALL
SELECT 
  'public.users' as tabla,
  COUNT(*) as registros
FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- 4. Ver si hay conflictos de ID entre auth.users y public.users
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_id,
  pu.email as public_email,
  CASE 
    WHEN au.id = pu.id THEN 'IDs coinciden'
    ELSE 'IDs NO coinciden - PROBLEMA'
  END as estado_ids
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'pepiancookingclass@gmail.com' 
   OR pu.email = 'pepiancookingclass@gmail.com';

-- 5. Ver todos los usuarios que tienen rol admin
SELECT 
  id,
  email,
  name,
  roles,
  created_at
FROM public.users 
WHERE roles::text LIKE '%admin%'
ORDER BY created_at;

-- =====================================================
-- RESULTADO ESPERADO:
-- - Debería existir en auth.users
-- - Debería existir en public.users con mismo ID
-- - Debería tener rol 'admin' en public.users
-- =====================================================
