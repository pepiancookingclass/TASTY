-- =====================================================
-- CREAR ADMIN DE PRUEBA - SIN COLUMNAS GENERADAS
-- =====================================================

DO $$
DECLARE
    new_admin_id UUID := gen_random_uuid();
BEGIN
    RAISE NOTICE 'Creando admin de prueba con ID: %', new_admin_id;
    
    -- Crear en auth.users (SIN confirmed_at - es generada)
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
        role
    ) VALUES (
        new_admin_id,
        '00000000-0000-0000-0000-000000000000',
        'admintest@tasty.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'sub', new_admin_id::text,
            'name', 'Admin Test',
            'email', 'admintest@tasty.com',
            'email_verified', true,
            'phone_verified', false
        ),
        jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
        ),
        'authenticated',
        'authenticated'
    );
    
    -- Crear en public.users
    INSERT INTO public.users (
        id,
        email,
        name,
        roles,
        skills,
        phone,
        created_at,
        updated_at
    ) VALUES (
        new_admin_id,
        'admintest@tasty.com',
        'Admin Test',
        ARRAY['admin', 'creator']::text[],
        ARRAY['admin']::text[],
        '',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Admin de prueba creado exitosamente';
    
END $$;

-- VERIFICAR
SELECT 
    'ADMIN_TEST_CREADO' as resultado,
    au.email,
    pu.roles,
    au.email_confirmed_at IS NOT NULL as confirmado,
    au.confirmed_at IS NOT NULL as confirmed_at_generado
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'admintest@tasty.com';




