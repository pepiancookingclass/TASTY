-- =====================================================
-- FIX: CAMBIAR DOMINIO DE EMAIL PARA QUE FUNCIONE
-- =====================================================

CREATE OR REPLACE FUNCTION test_with_resend_domain()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  request_result RECORD;
BEGIN
  -- Probar con dominio de Resend (no necesita verificación)
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
      'subject', '🎉 ¡TASTY Email Funcionando!',
      'html', '<h1>¡Perfecto!</h1><p>El sistema de emails de TASTY ya funciona correctamente.</p><p>Ahora puedes recibir:</p><ul><li>Emails de bienvenida</li><li>Confirmaciones de pedidos</li><li>Notificaciones de admin</li></ul>',
      'from', 'TASTY <onboarding@resend.dev>'
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
SELECT test_with_resend_domain();





