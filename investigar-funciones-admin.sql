-- =====================================================
-- INVESTIGAR FUNCIONES QUE PODRÍAN FALLAR CON ROL ADMIN
-- =====================================================

-- 1. LISTAR TODAS LAS FUNCIONES QUE MENCIONAN ADMIN O ROLES
SELECT 
  routine_name,
  routine_type,
  specific_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%admin%' 
    OR routine_definition ILIKE '%roles%'
    OR routine_definition ILIKE '%auth.uid%'
    OR routine_definition ILIKE '%auth.role%'
  )
ORDER BY routine_name;

-- 2. BUSCAR FUNCIONES QUE PODRÍAN EJECUTARSE EN LOGIN
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%handle_new_user%'
    OR routine_definition ILIKE '%on_auth_user%'
    OR routine_definition ILIKE '%welcome%'
    OR routine_definition ILIKE '%email%'
    OR routine_definition ILIKE '%trigger%'
  )
ORDER BY routine_name;

-- 3. VERIFICAR TRIGGERS ACTIVOS EN AUTH.USERS
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_statement,
  t.action_timing,
  t.action_orientation
FROM information_schema.triggers t
WHERE t.event_object_schema IN ('auth', 'public')
  AND (
    t.event_object_table = 'users'
    OR t.action_statement ILIKE '%users%'
  )
ORDER BY t.trigger_name;

-- 4. BUSCAR POLÍTICAS RLS ESPECÍFICAS PARA ADMIN
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE (
  qual ILIKE '%admin%' 
  OR with_check ILIKE '%admin%'
  OR roles::text ILIKE '%admin%'
)
ORDER BY schemaname, tablename, policyname;

-- 5. VERIFICAR FUNCIÓN handle_new_user ESPECÍFICAMENTE
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- 6. BUSCAR FUNCIONES DE EMAIL QUE PODRÍAN FALLAR
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name ILIKE '%email%'
ORDER BY routine_name;

-- 7. VERIFICAR SI HAY FUNCIONES QUE FALLEN CON ROLES JSON
-- Simular llamada a funciones con datos del admin
DO $$
DECLARE
    admin_id UUID;
    test_result TEXT;
BEGIN
    -- Obtener ID del admin
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = 'pepiancookingclass@gmail.com';
    
    IF admin_id IS NOT NULL THEN
        RAISE NOTICE 'Probando funciones con admin ID: %', admin_id;
        
        -- Probar si auth.uid() funciona con este usuario
        -- (Esto es solo informativo, no podemos simular auth.uid())
        RAISE NOTICE 'Admin encontrado, ID: %', admin_id;
    ELSE
        RAISE NOTICE 'Admin no encontrado en auth.users';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al probar funciones: %', SQLERRM;
END $$;

-- 8. VERIFICAR PERMISOS EN TABLAS RELACIONADAS
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasinserts,
  hasupdates,
  hasdeletes,
  hasselects
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'products', 'orders', 'creator_preapprovals')
ORDER BY tablename;

-- 9. BUSCAR EXTENSIONES O CONFIGURACIONES ESPECIALES
SELECT 
  name,
  setting,
  context,
  short_desc
FROM pg_settings 
WHERE name ILIKE '%auth%' 
   OR name ILIKE '%rls%'
   OR name ILIKE '%security%'
ORDER BY name;

-- =====================================================
-- OBJETIVO:
-- Encontrar funciones, triggers o políticas que podrían
-- estar causando "Database error querying schema" 
-- específicamente para el usuario admin
-- =====================================================



