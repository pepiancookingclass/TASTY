-- Verificar políticas RLS actuales
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
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Verificar que RLS esté habilitado en la tabla
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';





