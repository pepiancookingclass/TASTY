-- Probar con la key existente
CREATE OR REPLACE FUNCTION test_email_with_existing_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := '7fb64017297e842f59522ea46ee53bc38cf3ad66cbe628f';
  result TEXT;
BEGIN
  -- Probar envío directo
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', 'ruajhostal@gmail.com',
      'subject', 'Test con key existente',
      'html', '<h1>Probando con la key que ya tienes</h1>'
    )
  );
  
  RETURN 'Email enviado con key existente';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error con key existente: ' || SQLERRM;
END;
$$;

-- Ejecutar prueba
SELECT test_email_with_existing_key();





