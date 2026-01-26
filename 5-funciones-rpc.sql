-- 🔍 SECCIÓN 5: FUNCIONES RPC RELACIONADAS CON DELIVERY
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name LIKE '%delivery%'
   OR routine_name LIKE '%location%')
ORDER BY routine_name;

