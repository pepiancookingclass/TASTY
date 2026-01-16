-- =====================================================
-- PROBAR CON JWT CORRECTA
-- =====================================================

CREATE OR REPLACE FUNCTION test_with_correct_jwt()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  request_result RECORD;
BEGIN
  -- Probar con JWT correcta
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
      'subject', '🎉 Test con JWT Correcta - TASTY',
      'html', '<h1>¡Email de prueba exitoso!</h1><p>Si recibes esto, el sistema funciona perfectamente.</p>'
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
SELECT test_with_correct_jwt();




