-- =====================================================
-- VERIFICAR ESTRUCTURA REAL DE auth.users
-- =====================================================

-- 1. Ver todas las columnas de auth.users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Ver un registro existente para entender la estructura
SELECT *
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com'
LIMIT 1;

-- 3. Ver específicamente las columnas que necesitamos
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as tiene_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  -- user_metadata, -- Esta columna puede no existir
  aud,
  role,
  confirmed_at
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';



