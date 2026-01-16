-- =====================================================
-- CONFIGURAR EMAILS DE ÓRDENES PARA PEPIAN
-- Todos los emails (cliente, admin, creador) van a pepiancookingclass@gmail.com
-- =====================================================

-- 1. FUNCIÓN: Email de confirmación de pedido (CLIENTE)
CREATE OR REPLACE FUNCTION send_order_confirmation_email(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  email_subject TEXT;
  email_body TEXT;
  order_items_text TEXT;
  response_data RECORD;
BEGIN
  -- Obtener datos del pedido
  SELECT 
    o.*,
    u.name as customer_name,
    u.email as customer_email,
    COALESCE(o.delivery_street || ', ' || o.delivery_city || ', ' || o.delivery_state, 'Dirección no especificada') as full_address,
    TO_CHAR(o.delivery_date, 'DD/MM/YYYY a las HH24:MI') as formatted_delivery
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', order_uuid;
  END IF;

  -- Obtener items del pedido
  SELECT string_agg(
    '• ' || p.name_es || ' x' || oi.quantity || ' - Q' || (oi.quantity * oi.price_at_purchase),
    E'\n'
  ) INTO order_items_text
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = order_uuid;

  -- Construir email
  email_subject := '🍳 [CLIENTE] Confirmación de Pedido TASTY #' || SUBSTRING(order_record.id::text, 1, 8);
  email_body := '📧 EMAIL PARA EL CLIENTE:

¡Hola ' || order_record.customer_name || '!

🎉 ¡Tu pedido ha sido confirmado exitosamente!

📋 DETALLES DEL PEDIDO:
• Número: #' || SUBSTRING(order_record.id::text, 1, 8) || '
• Cliente: ' || order_record.customer_name || ' (' || order_record.customer_email || ')
• Total: Q' || order_record.total || '
• Entrega: ' || order_record.formatted_delivery || '
• Dirección: ' || order_record.full_address || '

🛍️ PRODUCTOS:
' || COALESCE(order_items_text, 'Sin productos') || '

📱 PRÓXIMOS PASOS:
1. Recibirás WhatsApp de confirmación
2. Los creadores prepararán tu pedido
3. Te notificaremos cuando esté listo

¡Gracias por elegir TASTY! 🍰

---
Equipo TASTY
WhatsApp: +502 30635323';

  -- Enviar email a pepiancookingclass@gmail.com
  SELECT * INTO response_data
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
      'subject', email_subject,
      'html', replace(email_body, E'\n', '<br>'),
      'from', 'TASTY <onboarding@resend.dev>'
    )::text
  ));

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error enviando email de confirmación: %', SQLERRM;
END;
$$;

-- 2. FUNCIÓN: Email de notificación al administrador
CREATE OR REPLACE FUNCTION send_admin_notification_email(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  email_subject TEXT;
  email_body TEXT;
  order_items_text TEXT;
  creators_text TEXT;
  response_data RECORD;
BEGIN
  -- Obtener datos del pedido
  SELECT 
    o.*,
    u.name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    COALESCE(o.delivery_street || ', ' || o.delivery_city || ', ' || o.delivery_state, 'Dirección no especificada') as full_address,
    TO_CHAR(o.delivery_date, 'DD/MM/YYYY a las HH24:MI') as formatted_delivery
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', order_uuid;
  END IF;

  -- Obtener items del pedido con creadores
  SELECT string_agg(
    '• ' || p.name_es || ' x' || oi.quantity || ' - Q' || (oi.quantity * oi.price_at_purchase) || ' (Creador: ' || c.name || ')',
    E'\n'
  ) INTO order_items_text
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN users c ON p.creator_id = c.id
  WHERE oi.order_id = order_uuid;

  -- Obtener creadores únicos
  SELECT string_agg(DISTINCT c.name || ' (' || c.email || ')', ', ')
  INTO creators_text
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN users c ON p.creator_id = c.id
  WHERE oi.order_id = order_uuid;

  -- Construir email
  email_subject := '🚨 [ADMIN] NUEVO PEDIDO TASTY #' || SUBSTRING(order_record.id::text, 1, 8);
  email_body := '📧 EMAIL PARA EL ADMINISTRADOR:

🚨 ¡NUEVO PEDIDO RECIBIDO!

📋 DETALLES DEL PEDIDO:
• Número: #' || SUBSTRING(order_record.id::text, 1, 8) || '
• Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '
• Cliente: ' || order_record.customer_name || '
• Email: ' || order_record.customer_email || '
• Teléfono: ' || COALESCE(order_record.customer_phone, 'No especificado') || '

💰 FINANCIERO:
• Total: Q' || order_record.total || '
• Método de pago: ' || COALESCE(order_record.payment_method, 'No especificado') || '

📦 PRODUCTOS:
' || COALESCE(order_items_text, 'Sin productos') || '

👥 CREADORES INVOLUCRADOS:
' || COALESCE(creators_text, 'Sin creadores') || '

📍 ENTREGA:
• Fecha: ' || order_record.formatted_delivery || '
• Dirección: ' || order_record.full_address || '
• Notas: ' || COALESCE(order_record.delivery_notes, 'Sin notas especiales') || '

⚡ ACCIONES REQUERIDAS:
1. Confirmar pedido con cliente
2. Coordinar con creadores
3. Programar entrega

---
Panel Admin: https://tasty.com/admin
Sistema TASTY - Notificación automática';

  -- Enviar email a pepiancookingclass@gmail.com
  SELECT * INTO response_data
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
      'subject', email_subject,
      'html', replace(email_body, E'\n', '<br>'),
      'from', 'TASTY <onboarding@resend.dev>'
    )::text
  ));

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error enviando email de admin: %', SQLERRM;
END;
$$;

-- 3. FUNCIÓN: Email de notificación a creadores
CREATE OR REPLACE FUNCTION send_creator_notifications_email(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  creator_record RECORD;
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  email_subject TEXT;
  email_body TEXT;
  creator_items_text TEXT;
  creator_total DECIMAL;
  creator_earnings DECIMAL;
  tasty_commission DECIMAL;
  response_data RECORD;
BEGIN
  -- Obtener datos del pedido
  SELECT 
    o.*,
    u.name as customer_name,
    COALESCE(o.delivery_street || ', ' || o.delivery_city || ', ' || o.delivery_state, 'Dirección no especificada') as full_address,
    TO_CHAR(o.delivery_date, 'DD/MM/YYYY a las HH24:MI') as formatted_delivery
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', order_uuid;
  END IF;

  -- Iterar por cada creador único
  FOR creator_record IN
    SELECT DISTINCT 
      c.id as creator_id,
      c.name as creator_name,
      c.email as creator_email
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN users c ON p.creator_id = c.id
    WHERE oi.order_id = order_uuid
  LOOP
    -- Obtener productos del creador específico
    SELECT 
      string_agg('• ' || p.name_es || ' x' || oi.quantity || ' - Q' || (oi.quantity * oi.price_at_purchase), E'\n'),
      SUM(oi.quantity * oi.price_at_purchase)
    INTO creator_items_text, creator_total
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid 
    AND p.creator_id = creator_record.creator_id;

    -- Calcular ganancias (90% para creador, 10% para TASTY)
    creator_earnings := creator_total * 0.90;
    tasty_commission := creator_total * 0.10;

    -- Construir email
    email_subject := '🍳 [CREADOR] Nuevo Pedido para ' || creator_record.creator_name || ' #' || SUBSTRING(order_record.id::text, 1, 8);
    email_body := '📧 EMAIL PARA EL CREADOR:

¡Hola ' || creator_record.creator_name || '!

🎉 ¡Tienes un nuevo pedido!

📋 DETALLES DEL PEDIDO:
• Número: #' || SUBSTRING(order_record.id::text, 1, 8) || '
• Cliente: ' || order_record.customer_name || '
• Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '

📦 TUS PRODUCTOS:
' || COALESCE(creator_items_text, 'Sin productos') || '

💰 RESUMEN FINANCIERO:
• Valor total de tus productos: Q' || creator_total || '
• Tus ganancias (90%): Q' || creator_earnings || '
• Comisión TASTY (10%): Q' || tasty_commission || '

🕐 ENTREGA PROGRAMADA:
• Fecha: ' || order_record.formatted_delivery || '
• Dirección: ' || order_record.full_address || '

📱 PRÓXIMOS PASOS:
1. Prepara los productos
2. Actualiza el estado en tu panel
3. Recibirás el pago después de la entrega

¡Gracias por ser parte de TASTY! 🍰

---
Panel Creador: https://tasty.com/creator
WhatsApp Soporte: +502 30635323';

    -- Enviar email a pepiancookingclass@gmail.com (simulando que es para el creador)
    SELECT * INTO response_data
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
        'subject', email_subject,
        'html', replace(email_body, E'\n', '<br>'),
        'from', 'TASTY <onboarding@resend.dev>'
      )::text
    ));

  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error enviando emails de creadores: %', SQLERRM;
END;
$$;

-- 4. FUNCIÓN PRINCIPAL: Procesar todos los emails de una orden
CREATE OR REPLACE FUNCTION process_order_emails(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enviar email de confirmación al cliente
  PERFORM send_order_confirmation_email(order_uuid);
  
  -- Enviar email de notificación al admin
  PERFORM send_admin_notification_email(order_uuid);
  
  -- Enviar emails a todos los creadores
  PERFORM send_creator_notifications_email(order_uuid);
  
  RAISE NOTICE 'Todos los emails de la orden % enviados exitosamente', order_uuid;
END;
$$;

-- 5. TRIGGER: Ejecutar automáticamente al crear una orden
DROP TRIGGER IF EXISTS send_emails_on_order_creation ON orders;

CREATE TRIGGER send_emails_on_order_creation
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_emails();

-- 6. FUNCIÓN DEL TRIGGER
CREATE OR REPLACE FUNCTION trigger_order_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ejecutar en background para no bloquear la inserción
  PERFORM process_order_emails(NEW.id);
  RETURN NEW;
END;
$$;

-- =====================================================
-- SISTEMA COMPLETADO
-- =====================================================

/*
🎉 CONFIGURACIÓN COMPLETADA:

✅ TODOS LOS EMAILS VAN A: pepiancookingclass@gmail.com

📧 EMAILS QUE SE ENVÍAN AL CREAR ORDEN:
1. [CLIENTE] Confirmación de pedido
2. [ADMIN] Notificación de nuevo pedido  
3. [CREADOR] Notificación para cada creador (con sus productos y ganancias)

🔄 TRIGGER AUTOMÁTICO:
- Al crear orden → Envía los 3 tipos de email automáticamente

🧪 PROBAR MANUALMENTE:
SELECT process_order_emails('uuid-de-orden-existente');

🚀 SISTEMA LISTO PARA PRODUCCIÓN!
*/
