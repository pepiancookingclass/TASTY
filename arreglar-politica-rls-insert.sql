-- =====================================================
-- ARREGLAR POLÍTICA RLS QUE BLOQUEA INSERT DE USUARIOS
-- =====================================================

-- 1. ELIMINAR POLÍTICA RLS ROTA
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 2. CREAR POLÍTICA RLS CORRECTA
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
    OR current_setting('role') = 'postgres'
  );

-- 3. VERIFICAR QUE LA POLÍTICA SE CREÓ CORRECTAMENTE
SELECT 
  'POLITICA_ARREGLADA' as estado,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users' 
  AND policyname = 'Users can insert own profile';

-- 4. VERIFICAR TODAS LAS POLÍTICAS
SELECT 
  'TODAS_LAS_POLITICAS' as tipo,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;
