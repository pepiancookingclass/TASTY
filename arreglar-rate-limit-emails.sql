-- =====================================================
-- ARREGLAR RATE LIMIT DE EMAILS - AGREGAR DELAYS
-- Solución: Delay de 1 segundo entre cada email
-- =====================================================

CREATE OR REPLACE FUNCTION send_order_confirmation_email(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  order_record RECORD;
  items_text TEXT;
BEGIN
  RAISE NOTICE '🚀 INICIANDO ENVÍO DE EMAILS PARA ORDEN: %', order_uuid;

  -- Obtener datos de la orden
  SELECT o.*, u.name as customer_name, o.total
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.id = order_uuid;

  RAISE NOTICE '📋 DATOS DE ORDEN OBTENIDOS: Cliente=%, Total=%', order_record.customer_name, order_record.total;

  -- Obtener productos
  SELECT string_agg(p.name_es || ' x1', ', ')
  INTO items_text
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = order_uuid;

  RAISE NOTICE '🛍️ PRODUCTOS: %', items_text;

  -- EMAIL 1: CLIENTE
  RAISE NOTICE '📧 ENVIANDO EMAIL AL CLIENTE...';
  PERFORM http((
    'POST',
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_key)
    ],
    'application/json',
    jsonb_build_object(
      'to', 'pepiancookingclass@gmail.com',
      'subject', '🍳 [CLIENTE] Confirmación Pedido #' || SUBSTRING(order_uuid::text, 1, 8),
      'html', '¡Hola ' || order_record.customer_name || '!<br><br>🎉 Tu pedido confirmado<br>📋 #' || SUBSTRING(order_uuid::text, 1, 8) || ' - Q' || order_record.total || '<br>🛍️ ' || COALESCE(items_text, 'Productos') || '<br><br>¡Gracias! 🍰',
      'from', 'TASTY <onboarding@resend.dev>'
    )::text
  ));
  RAISE NOTICE '✅ EMAIL CLIENTE ENVIADO';

  -- DELAY 1 SEGUNDO
  RAISE NOTICE '⏳ ESPERANDO 1 SEGUNDO PARA EVITAR RATE LIMIT...';
  PERFORM pg_sleep(1);

  -- EMAIL 2: ADMIN
  RAISE NOTICE '📧 ENVIANDO EMAIL AL ADMIN...';
  PERFORM http((
    'POST',
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_key)
    ],
    'application/json',
    jsonb_build_object(
      'to', 'pepiancookingclass@gmail.com',
      'subject', '🚨 [ADMIN] Nuevo Pedido #' || SUBSTRING(order_uuid::text, 1, 8),
      'html', '🚨 NUEVO PEDIDO<br><br>📋 #' || SUBSTRING(order_uuid::text, 1, 8) || '<br>👤 ' || order_record.customer_name || ' - Q' || order_record.total || '<br>📦 ' || COALESCE(items_text, 'Productos') || '<br>📍 ' || COALESCE(order_record.delivery_city, 'Ubicación') || '<br><br>⚡ Coordinar entrega',
      'from', 'TASTY <onboarding@resend.dev>'
    )::text
  ));
  RAISE NOTICE '✅ EMAIL ADMIN ENVIADO';

  -- DELAY 1 SEGUNDO
  RAISE NOTICE '⏳ ESPERANDO 1 SEGUNDO PARA EVITAR RATE LIMIT...';
  PERFORM pg_sleep(1);

  -- EMAIL 3: CREADOR
  RAISE NOTICE '📧 ENVIANDO EMAIL AL CREADOR...';
  PERFORM http((
    'POST',
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_key)
    ],
    'application/json',
    jsonb_build_object(
      'to', 'pepiancookingclass@gmail.com',
      'subject', '🍳 [CREADOR] Pedido para Creador #' || SUBSTRING(order_uuid::text, 1, 8),
      'html', '¡Hola Creador!<br><br>🎉 Nuevo pedido<br>📋 #' || SUBSTRING(order_uuid::text, 1, 8) || '<br>📦 Tu producto: ' || COALESCE(items_text, 'Productos') || '<br>💰 Tu ganancia: Q' || (order_record.total * 0.9) || ' (90%)<br><br>¡Prepara el producto! 🍰',
      'from', 'TASTY <onboarding@resend.dev>'
    )::text
  ));
  RAISE NOTICE '✅ EMAIL CREADOR ENVIADO';

  RAISE NOTICE '🎉 TODOS LOS EMAILS ENVIADOS EXITOSAMENTE PARA ORDEN: %', order_uuid;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR ENVIANDO EMAILS: %', SQLERRM;
END;
$$;

-- =====================================================
-- FUNCIÓN LISTA PARA EJECUTAR
-- Incluye delays de 1 segundo entre emails
-- =====================================================
