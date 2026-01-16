-- Verificar si los triggers están HABILITADOS
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  status
FROM information_schema.triggers 
WHERE event_object_table = 'orders';

-- Verificar configuración de triggers
SELECT 
  tgname as trigger_name,
  tgenabled as enabled_status,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgrelid = 'orders'::regclass;
