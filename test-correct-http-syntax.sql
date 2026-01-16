-- =====================================================
-- PROBAR CON SINTAXIS CORRECTA DE HTTP
-- =====================================================

-- Función de prueba con sintaxis correcta
CREATE OR REPLACE FUNCTION test_http_correct_syntax()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := '7fb64017297e842f59522ea46ee53bc38cf3ad66cbe628f';
  request_result RECORD;
BEGIN
  -- Probar con sintaxis básica de http
  SELECT * INTO request_result
  FROM http((
    'POST',
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_key)
    ],
    'application/json',
    jsonb_build_object(
      'to', 'ruajhostal@gmail.com',
      'subject', 'Test Sintaxis Correcta',
      'html', '<h1>¡Funciona!</h1>'
    )::text
  ));

  RETURN 'STATUS: ' || request_result.status || 
         ' | CONTENT: ' || COALESCE(request_result.content, 'NULL');

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Ejecutar prueba
SELECT test_http_correct_syntax();




