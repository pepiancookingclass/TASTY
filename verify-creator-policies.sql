-- Verificar políticas de todas las tablas relacionadas con creadores
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'products', 'orders', 'order_items')
ORDER BY tablename, cmd, policyname;

-- Verificar qué tablas tienen RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'products', 'orders', 'order_items')
ORDER BY tablename;
