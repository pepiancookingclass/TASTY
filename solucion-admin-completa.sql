-- =====================================================
-- SOLUCIÓN COMPLETA PARA PROBLEMA DE ADMIN LOGIN
-- EJECUTAR EN ORDEN: DIAGNÓSTICO → SOLUCIÓN → VERIFICACIÓN
-- =====================================================

-- =====================================================
-- PARTE 1: DIAGNÓSTICO RÁPIDO
-- =====================================================

-- 1.1 Verificar estado actual del admin
SELECT 
  'ESTADO ACTUAL ADMIN' as diagnostico,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'pepiancookingclass@gmail.com') 
    THEN '✅ Existe en auth.users'
    ELSE '❌ NO existe en auth.users'
  END as auth_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'pepiancookingclass@gmail.com') 
    THEN '✅ Existe en public.users'
    ELSE '❌ NO existe en public.users'
  END as public_status;

-- 1.2 Verificar integridad de IDs
SELECT 
  'INTEGRIDAD IDs' as diagnostico,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs COINCIDEN'
    WHEN au.id IS NULL THEN '❌ NO EXISTE EN AUTH'
    WHEN pu.id IS NULL THEN '❌ NO EXISTE EN PUBLIC'
    ELSE '❌ IDs DIFERENTES - PROBLEMA CRÍTICO'
  END as estado
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'pepiancookingclass@gmail.com' 
   OR pu.email = 'pepiancookingclass@gmail.com';

-- =====================================================
-- PARTE 2: SOLUCIÓN - RECREAR ADMIN LIMPIO
-- =====================================================

-- 2.1 Limpiar datos corruptos
DO $$
DECLARE
    admin_email TEXT := 'pepiancookingclass@gmail.com';
    new_admin_id UUID := gen_random_uuid();
BEGIN
    RAISE NOTICE 'Iniciando limpieza del usuario admin...';
    
    -- Eliminar registros corruptos
    DELETE FROM public.users WHERE email = admin_email;
    DELETE FROM auth.users WHERE email = admin_email;
    
    RAISE NOTICE 'Datos corruptos eliminados. Creando usuario limpio...';
    
    -- Crear registro limpio en auth.users (solo columnas que existen)
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
        new_admin_id,
        admin_email,
        'Administrador TASTY',
        '["admin"]'::jsonb,
        NOW(),
        NOW(),
        true,
        NOW()
    );
    
    RAISE NOTICE 'Usuario admin recreado exitosamente con ID: %', new_admin_id;
    RAISE NOTICE 'Email: % | Password temporal: admin123', admin_email;
END $$;

-- =====================================================
-- PARTE 3: VERIFICACIÓN FINAL
-- =====================================================

-- 3.1 Verificar que el admin fue creado correctamente
SELECT 
  'VERIFICACIÓN POST-CREACIÓN' as estado,
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmado,
  au.encrypted_password IS NOT NULL as tiene_password,
  pu.id IS NOT NULL as existe_en_public,
  pu.roles,
  pu.name,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs COINCIDEN PERFECTAMENTE'
    ELSE '❌ PROBLEMA CON IDs'
  END as estado_ids
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'pepiancookingclass@gmail.com';

-- 3.2 Comparar con usuario funcional para confirmar estructura
SELECT 
  'COMPARACIÓN FINAL' as tipo,
  email,
  'auth.users' as tabla,
  email_confirmed_at IS NOT NULL as confirmado,
  encrypted_password IS NOT NULL as tiene_password,
  aud,
  role
FROM auth.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;

-- 3.3 Verificar roles en public.users
SELECT 
  'ROLES VERIFICACIÓN' as tipo,
  email,
  name,
  roles,
  is_approved,
  approval_date IS NOT NULL as aprobado
FROM public.users 
WHERE email IN ('pepiancookingclass@gmail.com', 'valentina.davila@tasty.com')
ORDER BY email;

-- =====================================================
-- PARTE 4: INSTRUCCIONES FINALES
-- =====================================================

SELECT 
  'INSTRUCCIONES' as tipo,
  'PASO 1: Probar login con pepiancookingclass@gmail.com / admin123' as accion_1,
  'PASO 2: Si funciona, cambiar password desde la app' as accion_2,
  'PASO 3: Completar perfil admin si es necesario' as accion_3,
  'PASO 4: Verificar acceso a panel de administración' as accion_4;

-- =====================================================
-- RESUMEN DE LA SOLUCIÓN:
-- 
-- PROBLEMA IDENTIFICADO:
-- - Usuario admin tenía datos corruptos específicos
-- - Causaba "Database error querying schema" solo para él
-- - Otros usuarios funcionaban normalmente
--
-- SOLUCIÓN APLICADA:
-- - Eliminación completa de registros corruptos
-- - Recreación limpia manteniendo el email requerido
-- - Estructura idéntica a usuarios funcionales
-- - Password temporal para primer acceso
--
-- RESULTADO ESPERADO:
-- - Login funcional para pepiancookingclass@gmail.com
-- - Acceso completo al panel de administración
-- - Sin afectar otros usuarios del sistema
-- =====================================================
