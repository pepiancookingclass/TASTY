-- =====================================================
-- PROBAR CON EMAIL DEL ADMIN (PERMITIDO EN RESEND)
-- =====================================================

CREATE OR REPLACE FUNCTION test_with_admin_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  request_result RECORD;
BEGIN
  -- Probar con tu email (permitido en Resend)
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
      'to', 'pepiancookingclass@gmail.com',
      'subject', '🎉 ¡TASTY Email System FUNCIONANDO!',
      'html', '<h1>¡ÉXITO TOTAL!</h1><p>El sistema de emails de TASTY funciona perfectamente.</p><p><strong>Configuración completada:</strong></p><ul><li>✅ Edge Function desplegada</li><li>✅ Resend API configurada</li><li>✅ JWT correcta</li><li>✅ Sintaxis HTTP correcta</li></ul><p>Ahora todos los emails automáticos funcionarán:</p><ul><li>📧 Bienvenida a nuevos usuarios</li><li>📧 Confirmación de pedidos</li><li>📧 Notificaciones al admin</li></ul>',
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
SELECT test_with_admin_email();





