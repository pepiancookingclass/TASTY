-- 🔍 VERIFICAR SI EXISTEN LAS FUNCIONES DE PRIVACIDAD
-- Ejecutar en Supabase SQL Editor

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_privacy_status', 'delete_user_personal_data', 'get_user_order_stats')
ORDER BY routine_name;

-- Si no aparecen las funciones, hay que ejecutar fix-missing-privacy-functions.sql
SELECT 'Verificación de funciones de privacidad completada' as resultado;




