-- =====================================================
-- RESTAURAR TRIGGER BÁSICO PARA CREAR USUARIOS
-- Solo crear usuario en public.users, SIN emails
-- =====================================================

-- 1. FUNCIÓN: Crear usuario en public.users (SIN emails)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear usuario en public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    roles,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    CASE 
      WHEN NEW.email = 'pepiancookingclass@gmail.com' THEN ARRAY['admin']
      ELSE ARRAY['user']
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 2. CREAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. VERIFICAR
SELECT 
  'TRIGGER_RESTAURADO' as estado,
  trigger_name,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

