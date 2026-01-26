-- =====================================================
-- INVESTIGACIÓN DETALLADA: ¿QUÉ ESTÁ CORRUPTO EN EL ADMIN?
-- Comparar byte por byte admin vs usuario funcional
-- =====================================================

-- 1. COMPARAR METADATOS JSON - PUEDE SER LA CAUSA
SELECT 
  'METADATOS_ADMIN' as tipo,
  email,
  raw_user_meta_data,
  jsonb_pretty(raw_user_meta_data) as metadata_formateado,
  jsonb_typeof(raw_user_meta_data) as tipo_json
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'METADATOS_FUNCIONAL' as tipo,
  email,
  raw_user_meta_data,
  jsonb_pretty(raw_user_meta_data) as metadata_formateado,
  jsonb_typeof(raw_user_meta_data) as tipo_json
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';

-- 2. COMPARAR CAMPOS CRÍTICOS PARA AUTENTICACIÓN
SELECT 
  'CAMPOS_AUTH_ADMIN' as tipo,
  email,
  aud,
  role,
  instance_id,
  email_confirmed_at,
  phone_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  recovery_sent_at,
  email_change_sent_at,
  new_email,
  invited_at,
  action_link,
  email_change,
  email_change_confirm_status,
  banned_until,
  deleted_at
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'CAMPOS_AUTH_FUNCIONAL' as tipo,
  email,
  aud,
  role,
  instance_id,
  email_confirmed_at,
  phone_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  recovery_sent_at,
  email_change_sent_at,
  new_email,
  invited_at,
  action_link,
  email_change,
  email_change_confirm_status,
  banned_until,
  deleted_at
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';

-- 3. VERIFICAR SI HAY CAMPOS NULL QUE NO DEBERÍAN SERLO
SELECT 
  'CAMPOS_NULL_ADMIN' as check_type,
  email,
  CASE WHEN aud IS NULL THEN 'aud_NULL' ELSE 'aud_OK' END as aud_status,
  CASE WHEN role IS NULL THEN 'role_NULL' ELSE 'role_OK' END as role_status,
  CASE WHEN instance_id IS NULL THEN 'instance_NULL' ELSE 'instance_OK' END as instance_status,
  CASE WHEN email_confirmed_at IS NULL THEN 'email_conf_NULL' ELSE 'email_conf_OK' END as email_conf_status,
  CASE WHEN confirmed_at IS NULL THEN 'confirmed_NULL' ELSE 'confirmed_OK' END as confirmed_status
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'CAMPOS_NULL_FUNCIONAL' as check_type,
  email,
  CASE WHEN aud IS NULL THEN 'aud_NULL' ELSE 'aud_OK' END as aud_status,
  CASE WHEN role IS NULL THEN 'role_NULL' ELSE 'role_OK' END as role_status,
  CASE WHEN instance_id IS NULL THEN 'instance_NULL' ELSE 'instance_OK' END as instance_status,
  CASE WHEN email_confirmed_at IS NULL THEN 'email_conf_NULL' ELSE 'email_conf_OK' END as email_conf_status,
  CASE WHEN confirmed_at IS NULL THEN 'confirmed_NULL' ELSE 'confirmed_OK' END as confirmed_status
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';

-- 4. VERIFICAR LONGITUD Y FORMATO DE CONTRASEÑA
SELECT 
  'PASSWORD_CHECK' as tipo,
  email,
  LENGTH(encrypted_password) as password_length,
  LEFT(encrypted_password, 10) as password_prefix,
  encrypted_password LIKE '$2%' as es_bcrypt
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;

-- 5. BUSCAR DIFERENCIAS EN ESTRUCTURA JSON
SELECT 
  'JSON_KEYS_ADMIN' as tipo,
  jsonb_object_keys(raw_user_meta_data) as keys
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com'

UNION ALL

SELECT 
  'JSON_KEYS_FUNCIONAL' as tipo,
  jsonb_object_keys(raw_user_meta_data) as keys
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com'
ORDER BY tipo, keys;

-- 6. VERIFICAR SI HAY CARACTERES EXTRAÑOS EN EMAIL
SELECT 
  'EMAIL_CHECK' as tipo,
  email,
  LENGTH(email) as email_length,
  email = TRIM(email) as sin_espacios,
  email LIKE '%@gmail.com' as formato_correcto,
  ascii(LEFT(email, 1)) as primer_char_ascii,
  ascii(RIGHT(email, 1)) as ultimo_char_ascii
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;

-- 7. VERIFICAR DATOS EN public.users QUE PUEDAN CAUSAR PROBLEMAS
SELECT 
  'PUBLIC_DATA_CHECK' as tipo,
  email,
  name,
  roles,
  array_length(roles, 1) as roles_count,
  skills,
  profile_picture_url IS NOT NULL as tiene_foto,
  phone IS NOT NULL as tiene_telefono,
  created_at,
  updated_at
FROM public.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;




