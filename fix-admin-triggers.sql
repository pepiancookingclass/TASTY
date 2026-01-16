-- =====================================================
-- SOLUCIÓN DEFINITIVA: DESHABILITAR TRIGGERS PROBLEMÁTICOS
-- =====================================================

-- PASO 1: ELIMINAR TRIGGERS QUE CAUSAN "Database error querying schema"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;

-- PASO 2: VERIFICAR QUE SE ELIMINARON
SELECT 
  'TRIGGERS_ELIMINADOS' as resultado,
  COUNT(*) as triggers_restantes
FROM information_schema.triggers 
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
  AND trigger_name IN ('on_auth_user_created', 'send_welcome_email_trigger');

-- PASO 3: LIMPIAR METADATOS DEL ADMIN (POR SI ACASO)
UPDATE auth.users SET
  raw_user_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'name', 'Admin TASTY',
    'email', 'pepiancookingclass@gmail.com',
    'email_verified', true,
    'phone_verified', false
  ),
  updated_at = NOW()
WHERE email = 'pepiancookingclass@gmail.com';

-- PASO 4: VERIFICAR ESTADO FINAL DEL ADMIN
SELECT 
  'ADMIN_ESTADO_FINAL' as check_type,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado,
  confirmed_at IS NOT NULL as confirmado,
  raw_user_meta_data,
  aud,
  role
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- =====================================================
-- INSTRUCCIONES FINALES:
-- 1. Ejecutar este script
-- 2. Probar login: pepiancookingclass@gmail.com / admin123
-- 3. Si funciona → PROBLEMA RESUELTO
-- 4. Si no funciona → revisar logs de Supabase para más detalles
-- =====================================================

-- PARA RESTAURAR TRIGGERS DESPUÉS (SOLO SI LOGIN FUNCIONA):
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT OR UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();
-- 
-- CREATE TRIGGER send_welcome_email_trigger
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_welcome_email();



