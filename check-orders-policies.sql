-- Verificar políticas existentes en orders y order_items
SELECT 
    tablename, 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd;




