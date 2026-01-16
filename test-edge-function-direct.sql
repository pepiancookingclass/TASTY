-- Probar Edge Function directamente
SELECT http((
  'POST',
  'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
  ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4')
  ],
  'application/json',
  jsonb_build_object(
    'to', 'pepiancookingclass@gmail.com',
    'subject', 'Test desde SQL',
    'html', 'Test directo'
  )
));
