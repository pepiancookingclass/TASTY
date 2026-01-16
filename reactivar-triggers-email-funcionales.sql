-- =====================================================
-- REACTIVAR TRIGGERS DE EMAIL QUE SÍ FUNCIONAN CORRECTAMENTE
-- =====================================================

-- EVIDENCIA: 19 emails enviados exitosamente desde onboarding@resend.dev
-- Los triggers NO estaban rotos - los agentes fueron incompetentes

-- 1. REACTIVAR TRIGGER DE WELCOME EN AUTH.USERS
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

-- 2. REACTIVAR TRIGGER DE WELCOME EMAIL
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo para nuevos usuarios
  IF TG_OP = 'INSERT' THEN
    -- Llamar a la función de email (que SÍ funciona)
    PERFORM send_welcome_email(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. CREAR LOS TRIGGERS QUE LOS AGENTES ELIMINARON COMO COBARDES
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS send_welcome_email_trigger ON public.users;
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();

-- VERIFICAR QUE LOS TRIGGERS ESTÁN ACTIVOS
SELECT 
  'TRIGGERS_REACTIVADOS' as estado,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'send_welcome_email_trigger');

SELECT 'SISTEMA DE EMAIL RESTAURADO - FUNCIONARÁ COMO ANTES' as mensaje;



