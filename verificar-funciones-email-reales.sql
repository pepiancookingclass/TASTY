-- Ver qué funciones de email existen REALMENTE
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%email%' 
ORDER BY routine_name;

-- Ver el trigger actual
SELECT trigger_name, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders';
