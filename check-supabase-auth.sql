-- =====================================================
-- VERIFICAR ESTADO DEL SISTEMA DE AUTENTICACIÓN
-- =====================================================

-- 1. Verificar que la tabla auth.users existe y está accesible
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- 2. Verificar políticas RLS en auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- 3. Verificar si hay funciones que puedan interferir
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'auth'
OR routine_definition LIKE '%auth.users%';

-- 4. Verificar la tabla users del proyecto
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. Contar usuarios existentes
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_public_users FROM public.users;



