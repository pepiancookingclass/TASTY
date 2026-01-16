-- =====================================================
-- SOLUCIÓN DEFINITIVA: ARREGLAR METADATOS CORRUPTOS DEL ADMIN
-- =====================================================

-- PROBLEMA IDENTIFICADO: raw_user_meta_data del admin está corrupto
-- Falta: sub, name, email_verified, phone_verified
-- Sobra: roles (va en public.users, no en metadatos)

DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Obtener ID del admin
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = 'pepiancookingclass@gmail.com';
    
    IF admin_id IS NULL THEN
        RAISE NOTICE 'ERROR: Admin no encontrado';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Arreglando metadatos del admin ID: %', admin_id;
    
    -- ARREGLAR raw_user_meta_data con estructura correcta
    UPDATE auth.users SET
        raw_user_meta_data = jsonb_build_object(
            'sub', admin_id::text,
            'name', 'Admin TASTY',
            'email', 'pepiancookingclass@gmail.com',
            'email_verified', true,
            'phone_verified', false
        ),
        updated_at = NOW()
    WHERE email = 'pepiancookingclass@gmail.com';
    
    RAISE NOTICE '✅ Metadatos del admin arreglados correctamente';
    
END $$;

-- VERIFICAR QUE SE ARREGLÓ
SELECT 
    'ADMIN_ARREGLADO' as resultado,
    email,
    jsonb_pretty(raw_user_meta_data) as metadatos_nuevos
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- COMPARAR CON USUARIO FUNCIONAL
SELECT 
    'COMPARACION_FINAL' as check_type,
    email,
    raw_user_meta_data ? 'sub' as tiene_sub,
    raw_user_meta_data ? 'email_verified' as tiene_email_verified,
    raw_user_meta_data ? 'phone_verified' as tiene_phone_verified,
    raw_user_meta_data ? 'name' as tiene_name,
    raw_user_meta_data ? 'roles' as tiene_roles_incorrectos
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;

-- =====================================================
-- DESPUÉS DE EJECUTAR ESTE SCRIPT:
-- 1. Probar login: pepiancookingclass@gmail.com / admin123
-- 2. Debería funcionar correctamente
-- =====================================================



