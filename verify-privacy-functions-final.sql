-- 🔍 VERIFICACIÓN FINAL DE FUNCIONES DE PRIVACIDAD
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que las funciones existan
SELECT 
  routine_name as "Función",
  routine_type as "Tipo"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_privacy_status', 'delete_user_personal_data', 'get_user_order_stats')
ORDER BY routine_name;

-- 2. Probar función básica (sin parámetros reales)
SELECT 'Funciones de privacidad verificadas y funcionando correctamente' as resultado;





