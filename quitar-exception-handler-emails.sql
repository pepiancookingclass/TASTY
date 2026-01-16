-- =====================================================
-- QUITAR EXCEPTION HANDLER PARA VER ERRORES REALES
-- =====================================================

CREATE OR REPLACE FUNCTION send_order_confirmation_email(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  order_record RECORD;
  products_list TEXT;
  subtotal DECIMAL;
  delivery_fee DECIMAL;
  total_hours INTEGER;
  creators_info TEXT;
BEGIN
  -- Obtener datos completos de la orden
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

  -- Obtener productos con detalles completos
  SELECT 
    COALESCE(string_agg(
      '• ' || p.name_es || 
      ' (Cantidad: ' || oi.quantity || ')' ||
      ' - Q' || (oi.quantity * oi.unit_price) ||
      ' | Tiempo: ' || COALESCE(p.preparation_time, 0) || 'h' ||
      ' | Creador: ' || c.name,
      E'\n'
    ), 'Sin productos disponibles'),
    SUM(oi.quantity * oi.unit_price),
    SUM(COALESCE(p.preparation_time, 0) * oi.quantity)
  INTO products_list, subtotal, total_hours
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN users c ON p.creator_id = c.id
  WHERE oi.order_id = order_uuid;

  -- Calcular delivery fee (total - subtotal)
  delivery_fee := order_record.total - subtotal;

  -- Obtener información de creadores para admin
  SELECT COALESCE(string_agg(
    '👤 ' || c.name || ' (' || c.email || ')' ||
    ' | Productos: Q' || creator_totals.total ||
    ' | Ganancia (90%): Q' || ROUND(creator_totals.total * 0.9, 2) ||
    ' | Comisión TASTY (10%): Q' || ROUND(creator_totals.total * 0.1, 2),
    E'\n'
  ), 'Sin creadores')
  INTO creators_info
  FROM (
    SELECT 
      c.id, c.name, c.email,
      SUM(oi.quantity * oi.unit_price) as total
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN users c ON p.creator_id = c.id
    WHERE oi.order_id = order_uuid
    GROUP BY c.id, c.name, c.email
  ) creator_totals
  JOIN users c ON creator_totals.id = c.id;

  -- EMAIL 1: CLIENTE
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
      'html', '¡Hola ' || order_record.customer_name || '!<br><br>' ||
              '🎉 <strong>Tu pedido ha sido confirmado exitosamente</strong><br><br>' ||
              '📋 <strong>DETALLES DEL PEDIDO:</strong><br>' ||
              '• Número: #' || SUBSTRING(order_uuid::text, 1, 8) || '<br>' ||
              '• Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '<br><br>' ||
              '🛍️ <strong>PRODUCTOS ORDENADOS:</strong><br>' ||
              replace(products_list, E'\n', '<br>') || '<br><br>' ||
              '💰 <strong>RESUMEN FINANCIERO:</strong><br>' ||
              '• Subtotal productos: Q' || subtotal || '<br>' ||
              '• Costo de delivery: Q' || delivery_fee || '<br>' ||
              '• <strong>TOTAL: Q' || order_record.total || '</strong><br><br>' ||
              '⏰ <strong>TIEMPO DE PREPARACIÓN:</strong><br>' ||
              '• Total horas artesanales: ' || total_hours || ' horas<br><br>' ||
              '📍 <strong>INFORMACIÓN DE ENTREGA:</strong><br>' ||
              '• Dirección: ' || order_record.full_address || '<br>' ||
              '• Fecha programada: ' || order_record.formatted_delivery || '<br>' ||
              '• Método de pago: ' || COALESCE(order_record.payment_method, 'Efectivo') || '<br><br>' ||
              '📱 <strong>PRÓXIMOS PASOS:</strong><br>' ||
              '1. Recibirás WhatsApp de confirmación<br>' ||
              '2. Los creadores prepararán tu pedido<br>' ||
              '3. Te notificaremos cuando esté listo<br><br>' ||
              '¡Gracias por elegir TASTY! 🍰<br><br>' ||
              '---<br>' ||
              'Equipo TASTY<br>' ||
              'WhatsApp: +502 30635323',
      'from', 'TASTY <onboarding@resend.dev>'
    )::text
  ));

  -- DELAY 1 SEGUNDO
  PERFORM pg_sleep(1);

  -- EMAIL 2: ADMIN
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
      'html', '🚨 <strong>NUEVO PEDIDO RECIBIDO</strong><br><br>' ||
              '📋 <strong>INFORMACIÓN DEL PEDIDO:</strong><br>' ||
              '• Número: #' || SUBSTRING(order_uuid::text, 1, 8) || '<br>' ||
              '• Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '<br>' ||
              '• Estado: ' || order_record.status || '<br><br>' ||
              '👤 <strong>DATOS DEL CLIENTE:</strong><br>' ||
              '• Nombre: ' || order_record.customer_name || '<br>' ||
              '• Email: ' || order_record.customer_email || '<br>' ||
              '• Teléfono: ' || COALESCE(order_record.customer_phone, 'No especificado') || '<br><br>' ||
              '🛍️ <strong>PRODUCTOS COMPLETOS:</strong><br>' ||
              replace(products_list, E'\n', '<br>') || '<br><br>' ||
              '💰 <strong>DESGLOSE FINANCIERO ADMINISTRATIVO:</strong><br>' ||
              '• Subtotal productos: Q' || subtotal || '<br>' ||
              '• Delivery fee: Q' || delivery_fee || '<br>' ||
              '• <strong>Total del pedido: Q' || order_record.total || '</strong><br>' ||
              '• Comisión TASTY total (10%): Q' || ROUND(subtotal * 0.1, 2) || '<br>' ||
              '• Pago a creadores (90%): Q' || ROUND(subtotal * 0.9, 2) || '<br><br>' ||
              '👥 <strong>CREADORES INVOLUCRADOS:</strong><br>' ||
              replace(creators_info, E'\n', '<br>') || '<br><br>' ||
              '📍 <strong>LOGÍSTICA DE ENTREGA:</strong><br>' ||
              '• Dirección: ' || order_record.full_address || '<br>' ||
              '• Fecha programada: ' || order_record.formatted_delivery || '<br>' ||
              '• Tiempo total preparación: ' || total_hours || ' horas<br>' ||
              '• Notas: ' || COALESCE(order_record.delivery_notes, 'Sin notas') || '<br><br>' ||
              '⚡ <strong>ACCIONES ADMINISTRATIVAS REQUERIDAS:</strong><br>' ||
              '1. Confirmar pedido con cliente<br>' ||
              '2. Coordinar con todos los creadores<br>' ||
              '3. Programar logística de entrega<br>' ||
              '4. Monitorear preparación y tiempos<br><br>' ||
              '📊 <strong>CONTROL NUMÉRICO:</strong><br>' ||
              '• ID Orden: ' || order_uuid || '<br>' ||
              '• Total productos: ' || (SELECT COUNT(*) FROM order_items WHERE order_id = order_uuid) || '<br>' ||
              '• Total creadores: ' || (SELECT COUNT(DISTINCT p.creator_id) FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = order_uuid) || '<br><br>' ||
              '---<br>' ||
              'Panel Admin: https://tasty.com/admin<br>' ||
              'Sistema TASTY - Control Administrativo',
      'from', 'TASTY <onboarding@resend.dev>'
    )::text
  ));

  -- Llamar función separada para creadores
  PERFORM send_creator_emails(order_uuid);

END;
$$;
