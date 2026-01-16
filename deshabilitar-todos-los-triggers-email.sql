-- =====================================================
-- DESHABILITAR TODOS LOS TRIGGERS DE EMAIL QUE ESTÁN ENVIANDO CORREOS
-- =====================================================

-- 1. TRIGGERS DE USUARIOS (ya deshabilitados pero verificar)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON public.users;

-- 2. TRIGGERS DE ÓRDENES (ESTOS ESTÁN ACTIVOS Y ENVIANDO EMAILS)
DROP TRIGGER IF EXISTS send_emails_on_order_creation ON orders;
DROP TRIGGER IF EXISTS trigger_order_emails ON orders;

-- 3. TRIGGERS DE CAMBIO DE STATUS
DROP TRIGGER IF EXISTS send_status_change_emails ON orders;
DROP TRIGGER IF EXISTS trigger_status_change_notifications ON orders;

-- 4. CUALQUIER OTRO TRIGGER DE EMAIL
DROP TRIGGER IF EXISTS order_email_trigger ON orders;
DROP TRIGGER IF EXISTS email_notification_trigger ON orders;

-- VERIFICAR QUE TODOS LOS TRIGGERS ESTÁN ELIMINADOS
SELECT 
  'VERIFICACION_TRIGGERS' as tipo,
  trigger_name,
  event_object_table,
  event_object_schema
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%' 
   OR trigger_name LIKE '%welcome%'
   OR trigger_name LIKE '%order%'
   OR trigger_name LIKE '%notification%';

-- VERIFICAR TRIGGERS EN TABLA ORDERS ESPECÍFICAMENTE
SELECT 
  'TRIGGERS_ORDERS' as tipo,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders';

-- VERIFICAR TRIGGERS EN TABLA USERS
SELECT 
  'TRIGGERS_USERS' as tipo,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema IN ('public', 'auth');

SELECT 'TODOS LOS TRIGGERS DE EMAIL DESHABILITADOS' as mensaje;



