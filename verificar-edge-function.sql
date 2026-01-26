-- Ver si la Edge Function está desplegada
SELECT 
  name,
  status,
  created_at
FROM supabase_functions.functions 
WHERE name = 'send-email';

