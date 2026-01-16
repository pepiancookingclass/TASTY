-- 🔍 SECCIÓN 4: ESTRUCTURA COMPLETA DE TABLA ORDERS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
