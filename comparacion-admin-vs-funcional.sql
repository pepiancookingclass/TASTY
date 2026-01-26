-- =====================================================
-- COMPARACIÓN INTELIGENTE: ADMIN VS USUARIO FUNCIONAL
-- Solo usando columnas que realmente existen
-- =====================================================

-- 1. COMPARAR DATOS CRÍTICOS EN auth.users
SELECT 
  'ADMIN_CORRUPTO' as tipo,
  id,
  email,
  aud,
  role,
  encrypted_password IS NOT NULL as tiene_password,
  LENGTH(encrypted_password) as password_length,
  email_confirmed_at IS NOT NULL as email_confirmado,
  confirmed_at IS NOT NULL as confirmado,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  banned_until,
  deleted_at,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'USUARIO_FUNCIONAL' as tipo,
  id,
  email,
  aud,
  role,
  encrypted_password IS NOT NULL as tiene_password,
  LENGTH(encrypted_password) as password_length,
  email_confirmed_at IS NOT NULL as email_confirmado,
  confirmed_at IS NOT NULL as confirmado,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  banned_until,
  deleted_at,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';

-- 2. COMPARAR DATOS EN public.users
SELECT 
  'ADMIN_PUBLIC' as tipo,
  id,
  email,
  name,
  roles,
  array_length(roles, 1) as roles_count,
  skills,
  gender,
  profile_picture_url IS NOT NULL as tiene_foto,
  phone IS NOT NULL as tiene_telefono,
  creator_status,
  created_at,
  updated_at,
  last_sign_in_at
FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'FUNCIONAL_PUBLIC' as tipo,
  id,
  email,
  name,
  roles,
  array_length(roles, 1) as roles_count,
  skills,
  gender,
  profile_picture_url IS NOT NULL as tiene_foto,
  phone IS NOT NULL as tiene_telefono,
  creator_status,
  created_at,
  updated_at,
  last_sign_in_at
FROM public.users 
WHERE email = 'valentina.davila@tasty.com';

-- 3. VERIFICAR CAMPOS QUE PUEDEN CAUSAR PROBLEMAS
SELECT 
  'VERIFICACION_PROBLEMAS' as check_type,
  email,
  CASE WHEN banned_until IS NOT NULL THEN 'USUARIO_BANEADO' ELSE 'OK' END as ban_status,
  CASE WHEN deleted_at IS NOT NULL THEN 'USUARIO_ELIMINADO' ELSE 'OK' END as delete_status,
  CASE WHEN is_anonymous = true THEN 'ES_ANONIMO' ELSE 'OK' END as anon_status,
  CASE WHEN is_sso_user = true THEN 'ES_SSO' ELSE 'EMAIL_PASSWORD' END as auth_type,
  CASE WHEN email_confirmed_at IS NULL THEN 'EMAIL_NO_CONFIRMADO' ELSE 'OK' END as email_status
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;

-- 4. COMPARAR METADATOS JSON (PUEDE SER LA CAUSA)
SELECT 
  'METADATOS_ADMIN' as tipo,
  email,
  jsonb_pretty(raw_user_meta_data) as user_metadata,
  jsonb_pretty(raw_app_meta_data) as app_metadata
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'METADATOS_FUNCIONAL' as tipo,
  email,
  jsonb_pretty(raw_user_meta_data) as user_metadata,
  jsonb_pretty(raw_app_meta_data) as app_metadata
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';




