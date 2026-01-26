-- =====================================================
-- RECREAR USUARIO ADMIN LIMPIO
-- ¡¡¡ EJECUTAR SOLO CON POSTGRES ROLE !!!
-- =====================================================

-- PASO 1: GUARDAR ID ACTUAL DEL ADMIN (para mantener referencias)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Obtener el ID actual del admin
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = 'pepiancookingclass@gmail.com';
    
    -- Mostrar el ID que vamos a mantener
    RAISE NOTICE 'ID del admin a mantener: %', admin_id;
END $$;

-- PASO 2: LIMPIAR DATOS CORRUPTOS EN PUBLIC.USERS
-- Eliminar registro corrupto en public.users (si existe)
DELETE FROM public.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- PASO 3: LIMPIAR Y RECREAR EN AUTH.USERS
-- Primero obtener el ID para mantenerlo
DO $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'pepiancookingclass@gmail.com';
BEGIN
    -- Obtener ID actual
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    -- Si no existe, crear uno nuevo
    IF admin_id IS NULL THEN
        admin_id := gen_random_uuid();
        RAISE NOTICE 'Creando nuevo ID para admin: %', admin_id;
    ELSE
        RAISE NOTICE 'Manteniendo ID existente: %', admin_id;
    END IF;
    
    -- Eliminar registro corrupto
    DELETE FROM auth.users WHERE email = admin_email;
    
    -- Crear registro limpio en auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        user_metadata,
        aud,
        role,
        confirmed_at
    ) VALUES (
        admin_id,
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt('admin123', gen_salt('bf')), -- Contraseña temporal
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        'authenticated',
        'authenticated',
        NOW()
    );
    
    -- Crear registro limpio en public.users
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
        admin_id,
        admin_email,
        'Administrador TASTY',
        '["admin"]'::jsonb,
        NOW(),
        NOW(),
        true,
        NOW()
    );
    
    RAISE NOTICE 'Usuario admin recreado exitosamente con ID: %', admin_id;
END $$;

-- PASO 4: VERIFICAR QUE TODO ESTÁ CORRECTO
SELECT 
  'VERIFICACIÓN FINAL' as estado,
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmado,
  au.encrypted_password IS NOT NULL as tiene_password,
  pu.id IS NOT NULL as existe_en_public,
  pu.roles,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs COINCIDEN'
    ELSE '❌ PROBLEMA CON IDs'
  END as estado_ids
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'pepiancookingclass@gmail.com';

-- PASO 5: MOSTRAR RESUMEN
SELECT 
  'RESUMEN' as tipo,
  'Usuario admin recreado limpio' as mensaje,
  'Email: pepiancookingclass@gmail.com' as email,
  'Password temporal: admin123' as password,
  'Cambiar password después del primer login' as accion_requerida;

-- =====================================================
-- DESPUÉS DE EJECUTAR:
-- 1. Probar login con: pepiancookingclass@gmail.com / admin123
-- 2. Si funciona, cambiar contraseña desde la aplicación
-- 3. Completar perfil si es necesario
-- =====================================================




