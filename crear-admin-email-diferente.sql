-- =====================================================
-- SOLUCIÓN ALTERNATIVA: CREAR ADMIN CON EMAIL DIFERENTE
-- Si pepiancookingclass@gmail.com está corrupto a nivel de Supabase
-- =====================================================

-- 1. CREAR NUEVO ADMIN CON EMAIL LIMPIO
DO $$
DECLARE
    new_admin_id UUID := gen_random_uuid();
BEGIN
    RAISE NOTICE 'Creando nuevo admin con ID: %', new_admin_id;
    
    -- Crear en auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        raw_app_meta_data,
        aud,
        role,
        confirmed_at
    ) VALUES (
        new_admin_id,
        '00000000-0000-0000-0000-000000000000',
        'admin@tasty.com',  -- EMAIL DIFERENTE
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'sub', new_admin_id::text,
            'name', 'Admin TASTY',
            'email', 'admin@tasty.com',
            'email_verified', true,
            'phone_verified', false
        ),
        jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
        ),
        'authenticated',
        'authenticated',
        NOW()
    );
    
    -- Crear en public.users
    INSERT INTO public.users (
        id,
        email,
        name,
        roles,
        created_at,
        updated_at
    ) VALUES (
        new_admin_id,
        'admin@tasty.com',
        'Admin TASTY',
        ARRAY['admin']::text[],
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Nuevo admin creado: admin@tasty.com / admin123';
    
END $$;

-- 2. VERIFICAR QUE SE CREÓ CORRECTAMENTE
SELECT 
    'NUEVO_ADMIN' as resultado,
    au.id,
    au.email as auth_email,
    pu.email as public_email,
    pu.roles,
    au.email_confirmed_at IS NOT NULL as confirmado
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'admin@tasty.com';

-- =====================================================
-- CREDENCIALES DEL NUEVO ADMIN:
-- Email: admin@tasty.com
-- Password: admin123
-- 
-- DESPUÉS DE CONFIRMAR QUE FUNCIONA:
-- Actualizar referencias hardcodeadas en el código
-- =====================================================



