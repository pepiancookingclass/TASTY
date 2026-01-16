-- =====================================================
-- DIAGNÓSTICO: TODO EL SISTEMA DE AUTH ESTÁ ROTO
-- =====================================================

-- 1. VER QUÉ TRIGGERS ESTÁN ACTIVOS (PUEDEN ESTAR CAUSANDO ERROR 500)
SELECT 
  'TRIGGERS_ACTIVOS' as tipo,
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_schema IN ('auth', 'public')
  AND t.event_object_table = 'users'
ORDER BY t.trigger_name;

-- 2. VER FUNCIONES QUE PUEDEN ESTAR FALLANDO
SELECT 
  'FUNCIONES_PROBLEMATICAS' as tipo,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_name ILIKE '%handle_new_user%'
    OR routine_name ILIKE '%welcome%'
    OR routine_name ILIKE '%email%'
    OR routine_name ILIKE '%trigger%'
  )
ORDER BY routine_name;

-- 3. VER POLÍTICAS RLS QUE PUEDEN ESTAR FALLANDO
SELECT 
  'POLITICAS_RLS' as tipo,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- 4. VERIFICAR SI HAY EXTENSIONES FALTANTES
SELECT 
  'EXTENSIONES' as tipo,
  extname,
  extversion
FROM pg_extension
WHERE extname IN ('pgcrypto', 'uuid-ossp', 'pgjwt')
ORDER BY extname;



