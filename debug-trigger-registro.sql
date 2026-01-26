-- =====================================================
-- DEBUG: VERIFICAR POR QUÉ EL TRIGGER NO FUNCIONA
-- =====================================================

-- 1. VERIFICAR QUE EL TRIGGER EXISTE
SELECT 
  'TRIGGER_STATUS' as tipo,
  trigger_name,
  event_object_table,
  event_object_schema,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. VERIFICAR QUE LA FUNCIÓN EXISTE
SELECT 
  'FUNCTION_STATUS' as tipo,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. PROBAR LA FUNCIÓN MANUALMENTE
-- (SOLO PARA DEBUG - NO EJECUTAR EN PRODUCCIÓN)
-- SELECT handle_new_user();

-- 4. VER SI HAY ERRORES EN LA FUNCIÓN
SELECT 
  'FUNCTION_DEFINITION' as tipo,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 5. VERIFICAR POLÍTICAS RLS EN TABLA USERS
SELECT 
  'RLS_POLICIES' as tipo,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 6. VERIFICAR ESTRUCTURA DE TABLA USERS
SELECT 
  'TABLE_STRUCTURE' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

