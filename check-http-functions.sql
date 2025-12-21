-- =====================================================
-- VERIFICAR QUÉ FUNCIONES HTTP ESTÁN DISPONIBLES
-- =====================================================

-- 1. Ver todas las funciones de la extensión http
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'extensions' 
  AND p.proname LIKE '%http%'
ORDER BY p.proname;

-- 2. Ver todas las funciones disponibles en extensions
SELECT 
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'extensions'
ORDER BY p.proname;

-- 3. Verificar versión de la extensión http
SELECT extname, extversion FROM pg_extension WHERE extname = 'http';
