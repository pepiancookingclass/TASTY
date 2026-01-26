-- =====================================================
-- CREAR USUARIO ADMIN COMPLETAMENTE NUEVO
-- Eliminar el problemático y crear uno limpio
-- =====================================================

-- 1. ELIMINAR usuario problemático completamente
DELETE FROM public.users WHERE email = 'pepiancookingclass@gmail.com';
DELETE FROM auth.users WHERE email = 'pepiancookingclass@gmail.com';

-- 2. CREAR usuario admin completamente nuevo
-- Primero en auth.users
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
  gen_random_uuid(), -- Nuevo ID aleatorio
  'authenticated',
  'authenticated',
  'admin@tasty.com', -- NUEVO EMAIL
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin TASTY"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. Obtener el ID del usuario recién creado
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Obtener ID del usuario recién creado
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = 'admin@tasty.com';
  
  -- Crear registro en public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    roles,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@tasty.com',
    'Admin TASTY',
    ARRAY['admin', 'creator', 'customer'],
    NOW(),
    NOW()
  );
END $$;

-- 4. Verificar que se creó correctamente
SELECT 
  'NUEVO USUARIO ADMIN CREADO' as resultado,
  au.id,
  au.email as auth_email,
  pu.email as public_email,
  pu.roles
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'admin@tasty.com';

-- =====================================================
-- NUEVAS CREDENCIALES:
-- Email: admin@tasty.com
-- Password: admin123
-- =====================================================




