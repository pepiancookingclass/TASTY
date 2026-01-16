-- Revisar qué funciones ya existen relacionadas con pedidos
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname LIKE '%order%'
ORDER BY p.proname;

-- También revisar triggers relacionados con pedidos
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('orders', 'order_items', 'order_status_history')
ORDER BY c.relname, t.tgname;

-- Revisar estructura de tablas relacionadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('orders', 'order_items', 'order_status_history')
ORDER BY table_name, ordinal_position;




