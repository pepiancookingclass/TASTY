-- =====================================================
-- RESTAURAR TRIGGERS DE AUTENTICACIÓN - TASTY
-- ¡¡¡ IMPORTANTE: EJECUTAR DESPUÉS DE ARREGLAR EL PROBLEMA !!!
-- =====================================================

-- ESTOS TRIGGERS FUERON ELIMINADOS TEMPORALMENTE PARA SOLUCIONAR
-- EL PROBLEMA DE LOGIN. DEBEN SER RESTAURADOS DESPUÉS.

-- 1. RESTAURAR TRIGGER: on_auth_user_created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 2. RESTAURAR TRIGGER: send_welcome_email_trigger  
CREATE OR REPLACE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();

-- =====================================================
-- VERIFICAR QUE SE RESTAURARON CORRECTAMENTE
-- =====================================================

SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
AND trigger_name IN ('on_auth_user_created', 'send_welcome_email_trigger');

-- =====================================================
-- NOTAS:
-- - Ejecutar solo DESPUÉS de arreglar las funciones problemáticas
-- - Verificar que send_welcome_email() funcione correctamente
-- - Probar login antes y después de restaurar
-- =====================================================



