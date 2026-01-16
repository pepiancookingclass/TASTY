-- =====================================================
-- VERIFICAR SI EL TRIGGER DE EMAILS EXISTE Y FUNCIONA
-- =====================================================

-- 1. Ver si el trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%' 
OR action_statement LIKE '%send_order_confirmation_email%';

-- 2. Ver todas las funciones relacionadas con emails
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%email%'
AND routine_schema = 'public';

-- 3. Probar función manualmente (reemplazar UUID)
-- SELECT send_order_confirmation_email('PONER_UUID_DE_ORDEN_AQUI');
