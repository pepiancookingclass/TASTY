-- =====================================================
-- INVESTIGAR SI LOS TRIGGERS CAUSAN EL PROBLEMA
-- =====================================================

-- 1. Ver qué triggers están activos
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- 2. Ver si la función handle_new_user() funciona correctamente
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 3. Probar la función handle_new_user() manualmente
-- (SOLO PARA PROBAR - NO EJECUTAR EN PRODUCCIÓN)
-- SELECT handle_new_user();

-- 4. Ver si hay errores en la función trigger_welcome_email()
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'trigger_welcome_email'
AND routine_schema = 'public';

-- =====================================================
-- DIAGNÓSTICO: 
-- Si los triggers están causando problemas, los eliminaremos
-- temporalmente para que el admin pueda hacer login
-- =====================================================



