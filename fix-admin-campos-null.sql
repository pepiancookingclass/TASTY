-- =====================================================
-- ARREGLAR CAMPOS NULL QUE PUEDEN CAUSAR ERROR 500
-- =====================================================

-- PROBLEMA IDENTIFICADO: Admin tiene campos NULL que usuario funcional no tiene
-- - skills: null vs array con 1 elemento
-- - phone: null vs string vacío

-- ARREGLAR CAMPOS NULL DEL ADMIN
UPDATE public.users SET
  skills = ARRAY[]::text[],  -- Array vacío en lugar de NULL
  phone = '',                -- String vacío en lugar de NULL
  updated_at = NOW()
WHERE email = 'pepiancookingclass@gmail.com';

-- VERIFICAR QUE SE ARREGLÓ
SELECT 
  'ADMIN_ARREGLADO' as resultado,
  email,
  LENGTH(email) as email_len,
  LENGTH(name) as name_len,
  array_length(roles, 1) as roles_count,
  array_length(skills, 1) as skills_count,
  CASE WHEN phone IS NULL THEN 'NULL' ELSE LENGTH(phone)::text END as phone_len,
  skills,
  phone
FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- COMPARAR CON USUARIO FUNCIONAL
SELECT 
  'COMPARACION_FINAL' as check_type,
  email,
  array_length(skills, 1) as skills_count,
  CASE WHEN phone IS NULL THEN 'NULL' ELSE 'NOT_NULL' END as phone_status,
  skills IS NOT NULL as tiene_skills_array,
  phone IS NOT NULL as tiene_phone_string
FROM public.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;



