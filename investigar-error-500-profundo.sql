-- =====================================================
-- INVESTIGAR ERROR 500 EN /auth/v1/token - NIVEL PROFUNDO
-- =====================================================

-- 1. VERIFICAR SI HAY POLÍTICAS RLS QUE FALLEN CON ESTE USUARIO
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. BUSCAR FUNCIONES QUE SE EJECUTEN AUTOMÁTICAMENTE
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%auth.uid%'
    OR routine_definition ILIKE '%auth.role%'
    OR routine_definition ILIKE '%auth.email%'
  )
ORDER BY routine_name;

-- 3. VERIFICAR TRIGGERS ACTIVOS (PUEDEN HABERSE RESTAURADO)
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_statement,
  t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_schema IN ('auth', 'public')
ORDER BY t.trigger_name;

-- 4. BUSCAR DATOS INCONSISTENTES QUE PUEDAN CAUSAR ERROR 500
SELECT 
  'INCONSISTENCIAS' as check_type,
  COUNT(CASE WHEN au.id IS NULL THEN 1 END) as auth_sin_public,
  COUNT(CASE WHEN pu.id IS NULL THEN 1 END) as public_sin_auth,
  COUNT(CASE WHEN au.id != pu.id THEN 1 END) as ids_diferentes
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email;

-- 5. VERIFICAR SI EL ADMIN TIENE DATOS ÚNICOS QUE CAUSEN CONFLICTO
SELECT 
  'DATOS_UNICOS_ADMIN' as tipo,
  email,
  id,
  roles,
  creator_status,
  has_delivery,
  gender,
  address_country
FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- 6. COMPARAR LONGITUD DE CAMPOS (PUEDE HABER OVERFLOW)
SELECT 
  'LONGITUD_CAMPOS' as check_type,
  email,
  LENGTH(email) as email_len,
  LENGTH(name) as name_len,
  array_length(roles, 1) as roles_count,
  array_length(skills, 1) as skills_count,
  LENGTH(phone) as phone_len
FROM public.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;



