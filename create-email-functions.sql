-- =====================================================
-- FUNCIONES DE EMAIL PARA TASTY
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. FUNCIÓN: Enviar email de confirmación al cliente
CREATE OR REPLACE FUNCTION send_order_confirmation_email(
  customer_email TEXT,
  customer_name TEXT,
  order_id TEXT,
  order_total DECIMAL,
  order_items JSONB,
  delivery_address TEXT,
  estimated_delivery TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT;
  email_body TEXT;
  items_list TEXT := '';
  item JSONB;
BEGIN
  -- Construir lista de productos
  FOR item IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    items_list := items_list || '• ' || (item->>'quantity') || 'x ' || (item->>'name') || ' - Q' || (item->>'price') || E'\n';
  END LOOP;

  -- Construir email
  email_subject := '🍳 Confirmación de Pedido TASTY #' || SUBSTRING(order_id, 1, 8);
  
  email_body := '¡Hola ' || customer_name || '!

¡Tu pedido ha sido confirmado exitosamente! 🎉

📋 DETALLES DEL PEDIDO:
Número: #' || SUBSTRING(order_id, 1, 8) || '
Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '

📦 PRODUCTOS:
' || items_list || '
💰 TOTAL: Q' || order_total || '

📍 DIRECCIÓN DE ENTREGA:
' || delivery_address || '

🕐 ENTREGA ESTIMADA:
' || estimated_delivery || '

📱 PRÓXIMOS PASOS:
Nuestro agente se pondrá en contacto contigo para confirmar los detalles finales del pedido.

¡Gracias por elegir TASTY! 🍰

---
TASTY - Sabores hechos con amor
WhatsApp: +502 30635323';

  -- Enviar email usando Supabase Edge Functions
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', customer_email,
      'subject', email_subject,
      'html', replace(email_body, E'\n', '<br>')
    )
  );
END;
$$;

-- 2. FUNCIÓN: Enviar email al administrador
CREATE OR REPLACE FUNCTION send_admin_notification_email(
  order_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  order_total DECIMAL,
  order_items JSONB,
  delivery_address TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT;
  email_body TEXT;
  items_list TEXT := '';
  item JSONB;
  admin_email TEXT := 'admin@tasty.com'; -- Cambiar por email real del admin
BEGIN
  -- Construir lista de productos
  FOR item IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    items_list := items_list || '• ' || (item->>'quantity') || 'x ' || (item->>'name') || ' - Q' || (item->>'price') || ' (Creador: ' || (item->>'creator_name') || ')' || E'\n';
  END LOOP;

  -- Construir email
  email_subject := '🚨 NUEVO PEDIDO TASTY #' || SUBSTRING(order_id, 1, 8);
  
  email_body := '¡NUEVO PEDIDO RECIBIDO!

📋 DETALLES:
Pedido: #' || SUBSTRING(order_id, 1, 8) || '
Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '
Cliente: ' || customer_name || '
Teléfono: ' || customer_phone || '

📦 PRODUCTOS:
' || items_list || '
💰 TOTAL: Q' || order_total || '

📍 ENTREGA:
' || delivery_address || '

⚡ ACCIÓN REQUERIDA:
1. Confirmar pedido con cliente
2. Coordinar con creadores
3. Programar entrega

---
Panel Admin: https://tasty.com/admin';

  -- Enviar email
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', admin_email,
      'subject', email_subject,
      'html', replace(email_body, E'\n', '<br>')
    )
  );
END;
$$;

-- 3. FUNCIÓN: Enviar email al creador
CREATE OR REPLACE FUNCTION send_creator_notification_email(
  creator_email TEXT,
  creator_name TEXT,
  order_id TEXT,
  customer_name TEXT,
  creator_items JSONB,
  creator_total DECIMAL,
  creator_earnings DECIMAL,
  tasty_commission DECIMAL,
  delivery_date TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_subject TEXT;
  email_body TEXT;
  items_list TEXT := '';
  item JSONB;
BEGIN
  -- Construir lista de productos del creador
  FOR item IN SELECT * FROM jsonb_array_elements(creator_items)
  LOOP
    items_list := items_list || '• ' || (item->>'quantity') || 'x ' || (item->>'name') || ' - Q' || (item->>'price') || E'\n';
  END LOOP;

  -- Construir email
  email_subject := '🍳 Nuevo Pedido para ' || creator_name || ' #' || SUBSTRING(order_id, 1, 8);
  
  email_body := '¡Hola ' || creator_name || '!

¡Tienes un nuevo pedido! 🎉

📋 DETALLES:
Pedido: #' || SUBSTRING(order_id, 1, 8) || '
Cliente: ' || customer_name || '
Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '

📦 TUS PRODUCTOS:
' || items_list || '

💰 RESUMEN FINANCIERO:
Valor total de tus productos: Q' || creator_total || '
Tus ganancias (90%): Q' || creator_earnings || '
Comisión TASTY (10%): Q' || tasty_commission || '

🕐 ENTREGA PROGRAMADA:
' || delivery_date || '

📱 PRÓXIMOS PASOS:
1. Prepara los productos
2. Nuestro agente coordinará la entrega
3. Recibirás el pago después de la entrega

¡Gracias por ser parte de TASTY! 🍰

---
Panel Creador: https://tasty.com/creator
WhatsApp Soporte: +502 30635323';

  -- Enviar email
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', creator_email,
      'subject', email_subject,
      'html', replace(email_body, E'\n', '<br>')
    )
  );
END;
$$;

-- 4. FUNCIÓN PRINCIPAL: Procesar todos los emails de un pedido
CREATE OR REPLACE FUNCTION process_order_emails(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  order_items_json JSONB;
  creators_data JSONB := '[]'::JSONB;
  creator_record RECORD;
  delivery_address_text TEXT;
  estimated_delivery_text TEXT;
BEGIN
  -- Obtener datos del pedido
  SELECT 
    o.*,
    COALESCE(o.delivery_street || ', ' || o.delivery_city || ', ' || o.delivery_state, 'Dirección no especificada') as full_address,
    TO_CHAR(o.delivery_date, 'DD/MM/YYYY a las HH24:MI') as formatted_delivery
  INTO order_record
  FROM orders o
  WHERE o.id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', order_uuid;
  END IF;

  -- Obtener items del pedido con información de productos y creadores
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', oi.product_name_es,
      'quantity', oi.quantity,
      'price', (oi.unit_price * oi.quantity),
      'creator_id', p.creator_id,
      'creator_name', u.name,
      'creator_email', u.email
    )
  )
  INTO order_items_json
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN users u ON u.id = p.creator_id
  WHERE oi.order_id = order_uuid;

  -- 1. EMAIL AL CLIENTE
  PERFORM send_order_confirmation_email(
    order_record.customer_email,
    order_record.customer_name,
    order_record.id::TEXT,
    order_record.total,
    order_items_json,
    order_record.full_address,
    order_record.formatted_delivery
  );

  -- 2. EMAIL AL ADMINISTRADOR
  PERFORM send_admin_notification_email(
    order_record.id::TEXT,
    order_record.customer_name,
    order_record.customer_phone,
    order_record.total,
    order_items_json,
    order_record.full_address
  );

  -- 3. EMAILS A CADA CREADOR (agrupados por creador)
  FOR creator_record IN
    SELECT 
      p.creator_id,
      u.name as creator_name,
      u.email as creator_email,
      jsonb_agg(
        jsonb_build_object(
          'name', oi.product_name_es,
          'quantity', oi.quantity,
          'price', (oi.unit_price * oi.quantity)
        )
      ) as creator_items,
      SUM(oi.unit_price * oi.quantity) as creator_total
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN users u ON u.id = p.creator_id
    WHERE oi.order_id = order_uuid
    GROUP BY p.creator_id, u.name, u.email
  LOOP
    PERFORM send_creator_notification_email(
      creator_record.creator_email,
      creator_record.creator_name,
      order_record.id::TEXT,
      order_record.customer_name,
      creator_record.creator_items,
      creator_record.creator_total,
      creator_record.creator_total * 0.9, -- 90% para el creador
      creator_record.creator_total * 0.1, -- 10% comisión TASTY
      order_record.formatted_delivery
    );
  END LOOP;

END;
$$;

-- 5. TRIGGER: Enviar emails automáticamente cuando se crea un pedido
CREATE OR REPLACE FUNCTION trigger_order_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ejecutar el procesamiento de emails en background
  PERFORM process_order_emails(NEW.id);
  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS send_emails_on_order_creation ON orders;
CREATE TRIGGER send_emails_on_order_creation
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_emails();

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecutar este SQL en Supabase SQL Editor
-- 2. Crear la Edge Function 'send-email' (ver archivo separado)
-- 3. Configurar las variables de entorno para el servicio de email
-- =====================================================





