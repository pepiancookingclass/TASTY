-- =====================================================
-- ACTUALIZAR EMAILS CLIENTE Y ADMIN CON DESGLOSE CORRECTO
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
  creators_count INTEGER;
  client_payment_breakdown TEXT;
  admin_creator_breakdown TEXT;
BEGIN
  -- Obtener datos completos de la orden
  SELECT 
    o.*,
    u.name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    COALESCE(o.delivery_street || ', ' || o.delivery_city || ', ' || o.delivery_state, 'Dirección no especificada') as full_address,
    TO_CHAR(o.delivery_date AT TIME ZONE 'America/Guatemala', 'DD/MM/YYYY a las HH24:MI') as formatted_delivery
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', order_uuid;
  END IF;

  -- Contar creadores únicos
  SELECT COUNT(DISTINCT p.creator_id)
  INTO creators_count
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = order_uuid;

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

  -- ✅ GENERAR DESGLOSE PARA CLIENTE (multi vs single creador)
  IF creators_count > 1 THEN
    -- MULTI-CREADOR: Desglose por entregas separadas
    SELECT string_agg(
      '🚚 CUANDO LLEGUE ' || UPPER(creator_breakdown.creator_name) || ':<br>' ||
      '• ' || creator_breakdown.products_text || '<br>' ||
      '• Total productos: Q' || creator_breakdown.creator_subtotal || '<br>' ||
      '• Incluye impuestos y envío<br>' ||
      '• 💰 Pagas a ' || creator_breakdown.creator_name || ': Q' || 
      ROUND(creator_breakdown.creator_subtotal + (creator_breakdown.creator_subtotal * 0.12) + creator_breakdown.delivery_fee, 2),
      '<br><br>'
    )
    INTO client_payment_breakdown
    FROM (
      SELECT 
        c.name as creator_name,
        SUM(oi.quantity * oi.unit_price) as creator_subtotal,
        COALESCE((breakdown_item->>'delivery_fee')::decimal, 0) as delivery_fee,
        string_agg(p.name_es || ' (' || oi.quantity || ')', ' + ') as products_text
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users c ON p.creator_id = c.id
      LEFT JOIN jsonb_array_elements(COALESCE(order_record.delivery_breakdown, '[]'::jsonb)) AS breakdown_item
        ON (breakdown_item->>'creator_id')::uuid = c.id
      WHERE oi.order_id = order_uuid
      GROUP BY c.id, c.name, breakdown_item->>'delivery_fee'
    ) creator_breakdown;
  ELSE
    -- SINGLE-CREADOR: Desglose simple
    client_payment_breakdown := '💳 CÓMO VAS A PAGAR:<br>' ||
      '• Tus productos: Q' || subtotal || '<br>' ||
      '• Impuestos incluidos: Q' || ROUND(subtotal * 0.12, 2) || '<br>' ||
      '• Envío a tu dirección: Q' || delivery_fee || '<br>' ||
      '• 💰 Total a pagar: Q' || order_record.total || '<br><br>' ||
      '📝 Pagarás en efectivo cuando recibas tus productos';
  END IF;

  -- ✅ GENERAR DESGLOSE ADMINISTRATIVO
  SELECT string_agg(
    '📦 ' || UPPER(creator_breakdown.creator_name) || ':<br>' ||
    '• Productos: Q' || creator_breakdown.creator_subtotal || 
    ' | Ganancia (90%): Q' || ROUND(creator_breakdown.creator_subtotal * 0.9, 2) || 
    ' | Comisión TASTY: Q' || ROUND(creator_breakdown.creator_subtotal * 0.1, 2) || '<br>' ||
    '• Delivery: Q' || creator_breakdown.delivery_fee || 
    ' | IVA: Q' || ROUND(creator_breakdown.creator_subtotal * 0.12, 2) || '<br>' ||
    '• CLIENTE PAGA A ' || UPPER(creator_breakdown.creator_name) || ': Q' || 
    ROUND(creator_breakdown.creator_subtotal + (creator_breakdown.creator_subtotal * 0.12) + creator_breakdown.delivery_fee, 2),
    '<br><br>'
  )
  INTO admin_creator_breakdown
  FROM (
    SELECT 
      c.name as creator_name,
      SUM(oi.quantity * oi.unit_price) as creator_subtotal,
      COALESCE((breakdown_item->>'delivery_fee')::decimal, 0) as delivery_fee
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN users c ON p.creator_id = c.id
    LEFT JOIN jsonb_array_elements(COALESCE(order_record.delivery_breakdown, '[]'::jsonb)) AS breakdown_item
      ON (breakdown_item->>'creator_id')::uuid = c.id
    WHERE oi.order_id = order_uuid
    GROUP BY c.id, c.name, breakdown_item->>'delivery_fee'
  ) creator_breakdown;

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
              '🎉 <strong>¡Tu pedido ha sido confirmado exitosamente!</strong><br><br>' ||
              '📋 <strong>DETALLES DE TU PEDIDO:</strong><br>' ||
              '• Número: #' || SUBSTRING(order_uuid::text, 1, 8) || '<br>' ||
              '• Fecha: ' || TO_CHAR(NOW() AT TIME ZONE 'America/Guatemala', 'DD/MM/YYYY HH24:MI') || '<br>' ||
              '• Entrega estimada: ' || order_record.formatted_delivery || '<br>' ||
              '• Dirección: ' || order_record.full_address || '<br><br>' ||
              
              '🛍️ <strong>TU PEDIDO COMPLETO: Q' || order_record.total || '</strong><br><br>' ||
              
              CASE 
                WHEN creators_count > 1 THEN
                  '💳 <strong>CÓMO VAS A PAGAR (' || creators_count || ' entregas separadas):</strong><br><br>' ||
                  client_payment_breakdown || '<br><br>' ||
                  '📝 <strong>IMPORTANTE:</strong><br>' ||
                  '• Recibirás ' || creators_count || ' entregas en momentos diferentes<br>' ||
                  '• Cada creador te cobrará solo por sus productos<br>' ||
                  '• Paga en efectivo a cada uno cuando llegue<br><br>'
                ELSE
                  client_payment_breakdown || '<br><br>'
              END ||
              
              '📱 <strong>PRÓXIMOS PASOS:</strong><br>' ||
              '1. Recuerda enviar el WhatsApp desde tu plataforma de "Mis Pedidos" para que nuestro agente te ayude a coordinar la entrega<br>' ||
              '2. Los creadores prepararán tu pedido con amor<br>' ||
              '3. Te contactaremos para confirmar fecha y hora exacta de cada entrega<br>' ||
              '4. ¡Disfruta tus deliciosos productos artesanales!<br><br>' ||
              '💡 <strong>Si ya enviaste el WhatsApp, puedes omitir el paso 1</strong><br><br>' ||
              
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
              '• Fecha: ' || TO_CHAR(NOW() AT TIME ZONE 'America/Guatemala', 'DD/MM/YYYY HH24:MI') || '<br>' ||
              '• Estado: ' || order_record.status || '<br><br>' ||
              '👤 <strong>DATOS DEL CLIENTE:</strong><br>' ||
              '• Nombre: ' || order_record.customer_name || '<br>' ||
              '• Email: ' || order_record.customer_email || '<br>' ||
              '• Teléfono: ' || COALESCE(order_record.customer_phone, 'No especificado') || '<br><br>' ||
              
              '💰 <strong>DESGLOSE FINANCIERO ADMINISTRATIVO:</strong><br><br>' ||
              
              CASE 
                WHEN creators_count > 1 THEN
                  '👥 <strong>CREADORES Y PAGOS SEPARADOS:</strong><br>' ||
                  admin_creator_breakdown || '<br><br>' ||
                  '📊 <strong>RESUMEN ADMINISTRATIVO:</strong><br>' ||
                  '• Total pedido: Q' || order_record.total || '<br>' ||
                  '• Total comisiones TASTY: Q' || ROUND(subtotal * 0.1, 2) || '<br>' ||
                  '• Entregas separadas: ' || creators_count || '<br><br>'
                ELSE
                  '• Subtotal productos: Q' || subtotal || '<br>' ||
                  '• Delivery fee: Q' || delivery_fee || '<br>' ||
                  '• <strong>Total del pedido: Q' || order_record.total || '</strong><br>' ||
                  '• Comisión TASTY (10%): Q' || ROUND(subtotal * 0.1, 2) || '<br>' ||
                  '• Pago a creador (90%): Q' || ROUND(subtotal * 0.9, 2) || '<br><br>'
              END ||
              
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
              '• Total creadores: ' || creators_count || '<br><br>' ||
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
