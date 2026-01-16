-- =====================================================
-- VERIFICAR COLUMNAS REALES - NO ADIVINAR
-- =====================================================

-- 1. VER TODAS LAS COLUMNAS QUE EXISTEN EN auth.users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. VER TODAS LAS COLUMNAS QUE EXISTEN EN public.users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;



