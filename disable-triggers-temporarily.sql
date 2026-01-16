-- =====================================================
-- DESHABILITAR TRIGGERS TEMPORALMENTE
-- Para permitir login del admin
-- =====================================================

-- 1. Eliminar triggers problemáticos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;

-- 2. Verificar que se eliminaron
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- 3. Mensaje de confirmación
SELECT 'Triggers eliminados temporalmente - Probar login ahora' as resultado;

-- =====================================================
-- DESPUÉS DE PROBAR LOGIN:
-- 1. Si funciona: El problema son los triggers
-- 2. Si no funciona: El problema es más profundo
-- =====================================================



