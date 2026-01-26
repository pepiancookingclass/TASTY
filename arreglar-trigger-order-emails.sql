-- =====================================================
-- ARREGLAR TRIGGER_ORDER_EMAILS PARA QUE LLAME A LAS FUNCIONES CORRECTAS
-- =====================================================

-- Ver qué hace la función actual
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'trigger_order_emails';

-- Crear/reemplazar función trigger que llame a nuestras funciones
CREATE OR REPLACE FUNCTION trigger_order_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Llamar a nuestra función de emails
  PERFORM send_order_confirmation_email(NEW.id);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar el insert
    RAISE NOTICE 'Error en trigger_order_emails: %', SQLERRM;
    RETURN NEW;
END;
$$;

