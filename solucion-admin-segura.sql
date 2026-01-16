-- =====================================================
-- SOLUCIÓN SEGURA PARA ADMIN - PASO A PASO
-- =====================================================

-- PASO 1: VERIFICAR ESTRUCTURA ACTUAL
SELECT 
  'DIAGNÓSTICO INICIAL' as paso,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'pepiancookingclass@gmail.com') 
    THEN 'Admin existe en auth.users'
    ELSE 'Admin NO existe en auth.users'
  END as estado_auth,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'pepiancookingclass@gmail.com') 
    THEN 'Admin existe en public.users'
    ELSE 'Admin NO existe en public.users'
  END as estado_public;

-- PASO 2: VER ESTRUCTURA DE USUARIO FUNCIONAL
SELECT 
  'ESTRUCTURA USUARIO FUNCIONAL' as info,
  id,
  email,
  encrypted_password IS NOT NULL as tiene_password,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role,
  confirmed_at IS NOT NULL as confirmado
FROM auth.users 
WHERE email = 'valentina.davila@tasty.com';

-- PASO 3: ELIMINAR ADMIN CORRUPTO (SI EXISTE)
DELETE FROM public.users WHERE email = 'pepiancookingclass@gmail.com';
DELETE FROM auth.users WHERE email = 'pepiancookingclass@gmail.com';

-- PASO 4: CREAR ADMIN NUEVO CON ESTRUCTURA SIMPLE
DO $$
DECLARE
    admin_email TEXT := 'pepiancookingclass@gmail.com';
    new_admin_id UUID := gen_random_uuid();
BEGIN
    RAISE NOTICE 'Creando admin con ID: %', new_admin_id;
    
    -- Insertar en auth.users con estructura mínima
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        aud,
        role,
        confirmed_at
    ) VALUES (
        new_admin_id,
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        'authenticated',
        'authenticated',
        NOW()
    );
    
    -- Insertar en public.users
    INSERT INTO public.users (
        id,
        email,
        name,
        roles,
        created_at,
        updated_at,
        is_approved,
        approval_date
    ) VALUES (
        new_admin_id,
        admin_email,
        'Administrador TASTY',
        '["admin"]'::jsonb,
        NOW(),
        NOW(),
        true,
        NOW()
    );
    
    RAISE NOTICE 'Admin creado exitosamente';
END $$;

-- PASO 5: VERIFICAR RESULTADO
SELECT 
  'VERIFICACIÓN FINAL' as resultado,
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as confirmado,
  pu.roles,
  CASE 
    WHEN au.id = pu.id THEN '✅ TODO CORRECTO'
    ELSE '❌ PROBLEMA'
  END as estado
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'pepiancookingclass@gmail.com';

-- INSTRUCCIONES FINALES
SELECT 
  'INSTRUCCIONES' as tipo,
  'Email: pepiancookingclass@gmail.com' as email,
  'Password: admin123' as password,
  'Cambiar password después del primer login' as nota;



