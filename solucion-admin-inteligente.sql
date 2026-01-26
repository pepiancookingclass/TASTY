-- =====================================================
-- SOLUCIÓN INTELIGENTE PARA ADMIN - SIN ERRORES SQL
-- Basada en análisis de usuario funcional vs corrupto
-- =====================================================

-- IMPORTANTE: EJECUTAR PRIMERO diagnostico-estructuras-reales.sql
-- para confirmar la estructura antes de proceder

-- PASO 1: Obtener ID actual del admin (para reutilizar)
DO $$
DECLARE
    admin_id UUID;
    funcional_password_hash TEXT;
    funcional_metadata JSONB;
BEGIN
    -- Obtener ID existente del admin
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = 'pepiancookingclass@gmail.com';
    
    -- Obtener datos del usuario funcional como referencia
    SELECT encrypted_password, raw_user_meta_data 
    INTO funcional_password_hash, funcional_metadata
    FROM auth.users 
    WHERE email = 'valentina.davila@tasty.com';
    
    IF admin_id IS NULL THEN
        RAISE NOTICE 'ERROR: Admin no existe en auth.users';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Admin ID encontrado: %', admin_id;
    RAISE NOTICE 'Usando como referencia datos de usuario funcional';
    
    -- PASO 2: ACTUALIZAR auth.users (NO DELETE/INSERT)
    UPDATE auth.users SET
        encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW(),
        raw_user_meta_data = jsonb_build_object(
            'sub', admin_id::text,
            'name', 'Admin TASTY',
            'email', 'pepiancookingclass@gmail.com',
            'email_verified', true,
            'phone_verified', false,
            'provider', 'email',
            'providers', jsonb_build_array('email')
        ),
        aud = 'authenticated',
        role = 'authenticated',
        confirmed_at = NOW()
    WHERE email = 'pepiancookingclass@gmail.com';
    
    RAISE NOTICE 'auth.users actualizado correctamente';
    
    -- PASO 3: ACTUALIZAR O INSERTAR en public.users
    -- Usar UPSERT para evitar conflictos
    INSERT INTO public.users (
        id,
        email,
        name,
        roles,
        created_at,
        updated_at
    ) VALUES (
        admin_id,
        'pepiancookingclass@gmail.com',
        'Admin TASTY',
        ARRAY['admin']::text[],  -- CORRECTO: TEXT[] no JSONB
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        roles = EXCLUDED.roles,
        updated_at = EXCLUDED.updated_at;
    
    RAISE NOTICE 'public.users actualizado correctamente con roles TEXT[]';
    
    -- PASO 4: VERIFICAR RESULTADO
    PERFORM 1 FROM auth.users au
    JOIN public.users pu ON au.id = pu.id
    WHERE au.email = 'pepiancookingclass@gmail.com'
    AND pu.roles = ARRAY['admin']::text[];
    
    IF FOUND THEN
        RAISE NOTICE '✅ ÉXITO: Admin actualizado correctamente';
        RAISE NOTICE 'Email: pepiancookingclass@gmail.com';
        RAISE NOTICE 'Password: admin123';
        RAISE NOTICE 'Roles: admin (TEXT[])';
    ELSE
        RAISE NOTICE '❌ ERROR: Verificación falló';
    END IF;
    
END $$;

-- PASO 5: VERIFICACIÓN FINAL DETALLADA
SELECT 
    'VERIFICACION_FINAL' as resultado,
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmado,
    au.confirmed_at IS NOT NULL as confirmado,
    pu.roles,
    pg_typeof(pu.roles) as tipo_roles,
    CASE 
        WHEN au.id = pu.id AND pu.roles = ARRAY['admin']::text[] THEN '✅ TODO PERFECTO'
        WHEN au.id != pu.id THEN '❌ IDs NO COINCIDEN'
        WHEN pu.roles != ARRAY['admin']::text[] THEN '❌ ROLES INCORRECTOS'
        ELSE '❌ ERROR DESCONOCIDO'
    END as estado_final
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'pepiancookingclass@gmail.com';

-- PASO 6: COMPARAR CON USUARIO FUNCIONAL
SELECT 
    'COMPARACION_FINAL' as info,
    email,
    'auth.users' as tabla,
    email_confirmed_at IS NOT NULL as confirmado,
    encrypted_password IS NOT NULL as tiene_password
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')

UNION ALL

SELECT 
    'COMPARACION_FINAL' as info,
    email,
    'public.users' as tabla,
    TRUE as confirmado, -- placeholder
    roles IS NOT NULL as tiene_password -- placeholder, realmente es tiene_roles
FROM public.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email, tabla;




