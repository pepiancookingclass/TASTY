-- 🔍 VERIFICACIÓN SIMPLE DE FUNCIONES
-- Ejecutar en Supabase SQL Editor

-- Buscar funciones de privacidad
SELECT routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%privacy%' OR routine_name LIKE '%user%'
ORDER BY routine_name;





