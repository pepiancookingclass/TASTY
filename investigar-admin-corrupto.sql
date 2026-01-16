-- =====================================================
-- INVESTIGACIÓN PROFUNDA: USUARIO ADMIN CORRUPTO
-- Comparar admin vs usuario funcional para encontrar diferencias
-- =====================================================

-- 1. COMPARAR DATOS BÁSICOS EN AUTH.USERS
SELECT 
  'ADMIN' as tipo_usuario,
  id,
  email,
  email_confirmed_at,
  phone_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  user_metadata,
  aud,
  role,
  encrypted_password IS NOT NULL as tiene_password,
  LENGTH(encrypted_password) as password_length
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'FUNCIONAL' as tipo_usuario,
  id,
  email,
  email_confirmed_at,
  phone_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  user_metadata,
  aud,
  role,
  encrypted_password IS NOT NULL as tiene_password,
  LENGTH(encrypted_password) as password_length
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';

-- 2. COMPARAR DATOS EN PUBLIC.USERS
SELECT 
  'ADMIN' as tipo_usuario,
  id,
  email,
  name,
  roles,
  created_at,
  updated_at,
  profile_picture_url,
  phone,
  address_street,
  address_city,
  address_country,
  latitude,
  longitude,
  skills,
  workspace_photos,
  instagram_handle,
  motivation,
  is_approved,
  approval_date
FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'FUNCIONAL' as tipo_usuario,
  id,
  email,
  name,
  roles,
  created_at,
  updated_at,
  profile_picture_url,
  phone,
  address_street,
  address_city,
  address_country,
  latitude,
  longitude,
  skills,
  workspace_photos,
  instagram_handle,
  motivation,
  is_approved,
  approval_date
FROM public.users 
WHERE email = 'valentina.davila@tasty.com';

-- 3. VERIFICAR INTEGRIDAD DE IDs
SELECT 
  'VERIFICACIÓN IDs' as check_type,
  au.email,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs COINCIDEN'
    WHEN au.id IS NULL THEN '❌ NO EXISTE EN AUTH'
    WHEN pu.id IS NULL THEN '❌ NO EXISTE EN PUBLIC'
    ELSE '❌ IDs DIFERENTES'
  END as estado
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
   OR pu.email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com');

-- 4. BUSCAR REGISTROS DUPLICADOS O HUÉRFANOS
SELECT 
  'DUPLICADOS AUTH' as tipo,
  email,
  COUNT(*) as cantidad
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
GROUP BY email
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'DUPLICADOS PUBLIC' as tipo,
  email,
  COUNT(*) as cantidad
FROM public.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
GROUP BY email
HAVING COUNT(*) > 1;

-- 5. VERIFICAR POLÍTICAS RLS QUE PODRÍAN AFECTAR AL ADMIN
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 6. BUSCAR FUNCIONES QUE PODRÍAN FALLAR CON ROL ADMIN
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (routine_definition ILIKE '%admin%' 
       OR routine_definition ILIKE '%roles%'
       OR routine_definition ILIKE '%auth.uid%')
ORDER BY routine_name;

-- 7. VERIFICAR TRIGGERS ACTIVOS
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 8. BUSCAR DATOS CORRUPTOS EN CAMPOS JSON
SELECT 
  'ADMIN' as tipo,
  email,
  roles,
  CASE 
    WHEN roles IS NULL THEN 'roles es NULL'
    WHEN roles::text = '' THEN 'roles está vacío'
    WHEN NOT (roles ? 'admin') THEN 'NO tiene rol admin'
    ELSE 'roles parece correcto'
  END as estado_roles,
  raw_user_meta_data,
  user_metadata
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'FUNCIONAL' as tipo,
  email,
  roles,
  CASE 
    WHEN roles IS NULL THEN 'roles es NULL'
    WHEN roles::text = '' THEN 'roles está vacío'
    WHEN NOT (roles ? 'admin') THEN 'NO tiene rol admin'
    ELSE 'roles parece correcto'
  END as estado_roles,
  raw_user_meta_data,
  user_metadata
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'valentina.davila@tasty.com';

-- =====================================================
-- RESULTADO ESPERADO:
-- Encontrar diferencias específicas entre admin y usuario funcional
-- que expliquen por qué admin falla en "Database error querying schema"
-- =====================================================



