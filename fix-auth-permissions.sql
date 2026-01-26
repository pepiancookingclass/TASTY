-- =====================================================
-- FIX: PROBLEMAS DE AUTENTICACIÓN - TASTY
-- Resolver permisos y políticas RLS problemáticas
-- =====================================================

-- 1. VERIFICAR USUARIOS EN AUTH (con permisos de servicio)
-- Ejecutar como service_role
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
LIMIT 10;

-- 2. VERIFICAR POLÍTICAS RLS EN PUBLIC.USERS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 3. VERIFICAR SI HAY TRIGGERS PROBLEMÁTICOS
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema IN ('public', 'auth');

-- 4. VERIFICAR FUNCIONES QUE PUEDEN INTERFERIR CON AUTH
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%auth%' 
  OR routine_name LIKE '%user%'
  OR routine_name LIKE '%sign%'
  OR routine_name LIKE '%login%'
)
ORDER BY routine_name;

-- 5. VERIFICAR EXTENSIONES HABILITADAS
SELECT 
  extname,
  extversion
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'http');

-- 6. RESETEAR POLÍTICAS RLS BÁSICAS PARA USERS (SI ES NECESARIO)
-- SOLO EJECUTAR SI HAY PROBLEMAS CON LAS POLÍTICAS

-- Eliminar políticas problemáticas
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Crear políticas básicas y seguras
-- CREATE POLICY "Users can view own profile" ON public.users
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update own profile" ON public.users
--   FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Service role can manage all users" ON public.users
--   FOR ALL USING (auth.role() = 'service_role');

-- 7. VERIFICAR CONFIGURACIÓN DE AUTH
-- Esto debe ejecutarse como service_role
SELECT 
  setting_name,
  setting_value
FROM auth.config
WHERE setting_name IN (
  'SITE_URL',
  'JWT_SECRET',
  'JWT_EXP',
  'DISABLE_SIGNUP',
  'EXTERNAL_EMAIL_ENABLED'
);

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecutar este script como SERVICE_ROLE en Supabase
-- 2. Si hay políticas problemáticas, descomenta la sección 6
-- 3. Reportar todos los resultados
-- =====================================================




