-- =====================================================
-- DIAGNÓSTICO INTELIGENTE - ESTRUCTURAS REALES
-- Verificar antes de hacer cualquier cambio
-- =====================================================

-- 1. ESTRUCTURA REAL DE auth.users
SELECT 
  'ESTRUCTURA auth.users' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. ESTRUCTURA REAL DE public.users  
SELECT 
  'ESTRUCTURA public.users' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. COMPARAR USUARIO FUNCIONAL VS ADMIN CORRUPTO
-- Usuario que SÍ funciona (valentina.davila@tasty.com)
SELECT 
  'USUARIO_FUNCIONAL' as tipo,
  id,
  email,
  encrypted_password IS NOT NULL as tiene_password,
  LENGTH(encrypted_password) as password_length,
  email_confirmed_at IS NOT NULL as email_confirmado,
  confirmed_at IS NOT NULL as confirmado,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com'

UNION ALL

-- Usuario admin que NO funciona
SELECT 
  'ADMIN_CORRUPTO' as tipo,
  id,
  email,
  encrypted_password IS NOT NULL as tiene_password,
  LENGTH(encrypted_password) as password_length,
  email_confirmed_at IS NOT NULL as email_confirmado,
  confirmed_at IS NOT NULL as confirmado,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- 4. COMPARAR EN public.users
SELECT 
  'USUARIO_FUNCIONAL_PUBLIC' as tipo,
  id,
  email,
  name,
  roles,
  pg_typeof(roles) as tipo_roles,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'valentina.davila@tasty.com'

UNION ALL

SELECT 
  'ADMIN_CORRUPTO_PUBLIC' as tipo,
  id,
  email,
  name,
  roles,
  pg_typeof(roles) as tipo_roles,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- 5. VERIFICAR CONSISTENCIA DE IDs
SELECT 
  'VERIFICACION_IDS' as check_type,
  au.id as auth_id,
  pu.id as public_id,
  au.email,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs COINCIDEN'
    ELSE '❌ IDs NO COINCIDEN - PROBLEMA CRÍTICO'
  END as estado_ids
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY au.email;

-- 6. BUSCAR DUPLICADOS O CONFLICTOS
SELECT 
  'BUSCAR_DUPLICADOS' as check_type,
  email,
  COUNT(*) as cantidad_auth
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
GROUP BY email;

SELECT 
  'BUSCAR_DUPLICADOS_PUBLIC' as check_type,
  email,
  COUNT(*) as cantidad_public
FROM public.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
GROUP BY email;




