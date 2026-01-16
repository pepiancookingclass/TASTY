-- =====================================================
-- SOLUCIÓN URGENTE: DESHABILITAR TRIGGERS QUE ROMPEN EL SISTEMA
-- =====================================================

-- ELIMINAR TODOS LOS TRIGGERS QUE CAUSAN ERROR 500
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;

-- VERIFICAR QUE SE ELIMINARON
SELECT 
  'TRIGGERS_ELIMINADOS' as resultado,
  COUNT(*) as triggers_restantes
FROM information_schema.triggers 
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- MENSAJE
SELECT 'SISTEMA REPARADO - PRUEBA LOGIN/REGISTRO AHORA' as mensaje;



