-- SOLUCIÓN DIRECTA - SIN TONTERÍAS
-- Basado en la estructura real de valentina.davila@tasty.com

-- 1. LIMPIAR Y CREAR ADMIN EN UN SOLO BLOQUE
DO $$
DECLARE
    existing_id UUID;
    new_id UUID;
BEGIN
    -- Obtener ID existente si existe
    SELECT id INTO existing_id FROM auth.users WHERE email = 'pepiancookingclass@gmail.com';
    
    IF existing_id IS NOT NULL THEN
        -- Usar ID existente
        new_id := existing_id;
        -- Eliminar registros existentes
        DELETE FROM public.users WHERE email = 'pepiancookingclass@gmail.com';
        DELETE FROM auth.users WHERE email = 'pepiancookingclass@gmail.com';
        RAISE NOTICE 'Admin existente eliminado, reutilizando ID: %', new_id;
    ELSE
        -- Crear nuevo ID
        new_id := gen_random_uuid();
        RAISE NOTICE 'Creando nuevo admin con ID: %', new_id;
    END IF;
    
    -- auth.users (SIN confirmed_at - es generada)
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
        role
    ) VALUES (
        new_id,
        '00000000-0000-0000-0000-000000000000',
        'pepiancookingclass@gmail.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        ('{"sub":"' || new_id || '","name":"Admin TASTY","email":"pepiancookingclass@gmail.com","email_verified":true,"phone_verified":false}')::jsonb,
        'authenticated',
        'authenticated'
    );
    
    -- public.users (SOLO COLUMNAS BÁSICAS)
    INSERT INTO public.users (
        id,
        email,
        name,
        roles,
        created_at,
        updated_at
    ) VALUES (
        new_id,
        'pepiancookingclass@gmail.com',
        'Admin TASTY',
        ARRAY['admin']::text[],
        NOW(),
        NOW()
    );
END $$;

-- 3. VERIFICAR
SELECT 'LISTO' as estado, id, email FROM auth.users WHERE email = 'pepiancookingclass@gmail.com';
