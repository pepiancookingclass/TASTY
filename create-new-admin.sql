-- =====================================================
-- CREAR NUEVO USUARIO ADMIN (SI EL ACTUAL NO FUNCIONA)
-- ¡¡¡ EJECUTAR SOLO CON POSTGRES ROLE !!!
-- =====================================================

-- 1. Eliminar usuario problemático de auth.users (OPCIONAL)
-- DELETE FROM auth.users WHERE email = 'pepiancookingclass@gmail.com';

-- 2. Crear nuevo usuario admin en auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '0c75a987-d54c-4046-81cc-d4c7a914249f', -- Mismo ID que en public.users
  'authenticated',
  'authenticated',
  'pepiancookingclass@gmail.com',
  crypt('admin123', gen_salt('bf')), -- Contraseña temporal
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW();

-- 3. Verificar que se creó correctamente
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- =====================================================
-- CREDENCIALES TEMPORALES:
-- Email: pepiancookingclass@gmail.com
-- Password: admin123
-- ¡¡¡ CAMBIAR DESPUÉS DEL PRIMER LOGIN !!!
-- =====================================================




