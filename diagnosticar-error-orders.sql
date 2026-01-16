-- 🔍 DIAGNÓSTICO COMPLETO: ERROR 400 AL CREAR ORDEN
-- Ejecutar cada sección por separado

-- ========================================
-- SECCIÓN 1: ESTRUCTURA COMPLETA DE ORDERS
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- SECCIÓN 2: CONSTRAINTS DE ORDERS
-- ========================================
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'orders' 
  AND tc.table_schema = 'public';

-- ========================================
-- SECCIÓN 3: FOREIGN KEYS DE ORDERS
-- ========================================
SELECT 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'orders';

-- ========================================
-- SECCIÓN 4: VERIFICAR USER_ID EXISTE
-- ========================================
SELECT 
  id, 
  email, 
  name 
FROM users 
WHERE id = '31f72af9-2f48-4cbc-928d-4b88902b44c4';

-- ========================================
-- SECCIÓN 5: PROBAR INSERT MÍNIMO
-- ========================================
-- COMENTADO - Solo para referencia de campos mínimos
/*
INSERT INTO orders (
  user_id,
  customer_name,
  total,
  status
) VALUES (
  '31f72af9-2f48-4cbc-928d-4b88902b44c4',
  'Test Order',
  100.00,
  'new'
) RETURNING id;
*/

-- ========================================
-- SECCIÓN 6: VERIFICAR RLS POLICIES
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'orders';
