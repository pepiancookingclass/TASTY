-- RLS bloquea triggers. Crear función que bypasse RLS
CREATE OR REPLACE FUNCTION trigger_send_order_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecuta con permisos de owner, no del usuario
SET search_path = public
AS $$
BEGIN
  -- Ejecutar con permisos de sistema
  PERFORM send_order_confirmation_email(NEW.id);
  RETURN NEW;
END;
$$;

