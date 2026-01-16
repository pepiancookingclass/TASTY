-- 🔍 SECCIÓN 2: ESTRUCTURA DE TABLA USERS (ubicaciones)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND (column_name LIKE '%location%' 
   OR column_name LIKE '%address%'
   OR column_name LIKE '%latitude%'
   OR column_name LIKE '%longitude%')
ORDER BY ordinal_position;
