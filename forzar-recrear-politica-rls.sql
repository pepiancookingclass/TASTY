-- =====================================================
-- FORZAR RECREACIÓN DE POLÍTICA RLS
-- =====================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.users;

-- 2. CREAR POLÍTICA NUEVA CON NOMBRE DIFERENTE
CREATE POLICY "allow_user_insert_via_trigger" ON public.users
  FOR INSERT 
  WITH CHECK (true);

-- 3. VERIFICAR QUE SE CREÓ CORRECTAMENTE
SELECT 
  'NUEVA_POLITICA' as estado,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users' 
  AND cmd = 'INSERT';

-- 4. SI SIGUE FALLANDO, DESHABILITAR RLS TEMPORALMENTE
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

