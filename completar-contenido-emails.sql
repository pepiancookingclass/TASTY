-- =====================================================
-- COMPLETAR CONTENIDO DE EMAILS CON INFORMACIÓN DETALLADA
-- Cliente, Creador y Admin con datos específicos
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
  admin_financial_breakdown TEXT;
BEGIN
  RAISE NOTICE '🚀 INICIANDO ENVÍO DE EMAILS COMPLETOS PARA ORDEN: %', order_uuid;

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

  RAISE NOTICE '📋 DATOS DE ORDEN OBTENIDOS: Cliente=%, Total=%', order_record.customer_name, order_record.total;

  -- Obtener productos con detalles completos
  SELECT 
    string_agg(
      '• ' || p.name_es || 
      ' (Cantidad: ' || oi.quantity || ')' ||
      ' - Q' || (oi.quantity * oi.price_at_purchase) ||
      ' | Tiempo: ' || COALESCE(p.preparation_time, 0) || 'h' ||
      ' | Creador: ' || c.name,
      E'\n'
    ),
    SUM(oi.quantity * oi.price_at_purchase),
    SUM(COALESCE(p.preparation_time, 0) * oi.quantity)
  INTO products_list, subtotal, total_hours
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN users c ON p.creator_id = c.id
  WHERE oi.order_id = order_uuid;

  -- Calcular delivery fee (total - subtotal)
  delivery_fee := order_record.total - subtotal;

  RAISE NOTICE '🛍️ PRODUCTOS: %', products_list;
  RAISE NOTICE '💰 SUBTOTAL: %, DELIVERY: %, TOTAL: %', subtotal, delivery_fee, order_record.total;

  -- Obtener información de creadores para admin
  SELECT string_agg(
    '👤 ' || c.name || ' (' || c.email || ')' ||
    ' | Productos: Q' || creator_totals.total ||
    ' | Ganancia (90%): Q' || ROUND(creator_totals.total * 0.9, 2) ||
    ' | Comisión TASTY (10%): Q' || ROUND(creator_totals.total * 0.1, 2),
    E'\n'
  )
  INTO creators_info
  FROM (
    SELECT 
      c.id, c.name, c.email,
      SUM(oi.quantity * oi.price_at_purchase) as total
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN users c ON p.creator_id = c.id
    WHERE oi.order_id = order_uuid
    GROUP BY c.id, c.name, c.email
  ) creator_totals
  JOIN users c ON creator_totals.id = c.id;

  -- EMAIL 1: CLIENTE
  RAISE NOTICE '📧 ENVIANDO EMAIL COMPLETO AL CLIENTE...';
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
              replace(COALESCE(products_list, 'Sin productos'), E'\n', '<br>') || '<br><br>' ||
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
  RAISE NOTICE '✅ EMAIL CLIENTE ENVIADO';

  -- DELAY 1 SEGUNDO
  RAISE NOTICE '⏳ ESPERANDO 1 SEGUNDO...';
  PERFORM pg_sleep(1);

  -- EMAIL 2: ADMIN
  RAISE NOTICE '📧 ENVIANDO EMAIL COMPLETO AL ADMIN...';
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
              replace(COALESCE(products_list, 'Sin productos'), E'\n', '<br>') || '<br><br>' ||
              '💰 <strong>DESGLOSE FINANCIERO ADMINISTRATIVO:</strong><br>' ||
              '• Subtotal productos: Q' || subtotal || '<br>' ||
              '• Delivery fee: Q' || delivery_fee || '<br>' ||
              '• <strong>Total del pedido: Q' || order_record.total || '</strong><br>' ||
              '• Comisión TASTY total (10%): Q' || ROUND(subtotal * 0.1, 2) || '<br>' ||
              '• Pago a creadores (90%): Q' || ROUND(subtotal * 0.9, 2) || '<br><br>' ||
              '👥 <strong>CREADORES INVOLUCRADOS:</strong><br>' ||
              replace(COALESCE(creators_info, 'Sin creadores'), E'\n', '<br>') || '<br><br>' ||
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
  RAISE NOTICE '✅ EMAIL ADMIN ENVIADO';

  -- DELAY 1 SEGUNDO
  RAISE NOTICE '⏳ ESPERANDO 1 SEGUNDO...';
  PERFORM pg_sleep(1);

  -- EMAIL 3: CREADORES (uno por cada creador)
  RAISE NOTICE '📧 ENVIANDO EMAILS A CREADORES...';
  
  -- Loop por cada creador único
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
    -- Obtener productos específicos del creador
    SELECT 
      string_agg(
        '• ' || p.name_es || 
        ' (Cantidad: ' || oi.quantity || ')' ||
        ' - Q' || (oi.quantity * oi.price_at_purchase) ||
        ' | Tiempo: ' || COALESCE(p.preparation_time, 0) || 'h',
        E'\n'
      ),
      SUM(oi.quantity * oi.price_at_purchase),
      SUM(COALESCE(p.preparation_time, 0) * oi.quantity)
    INTO products_list, subtotal, total_hours
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid 
    AND p.creator_id = creator_record.creator_id;

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
        'subject', '🍳 [CREADOR] Pedido para ' || creator_record.creator_name || ' #' || SUBSTRING(order_uuid::text, 1, 8),
        'html', '¡Hola ' || creator_record.creator_name || '!<br><br>' ||
                '🎉 <strong>¡Tienes un nuevo pedido!</strong><br><br>' ||
                '📋 <strong>DETALLES DEL PEDIDO:</strong><br>' ||
                '• Número: #' || SUBSTRING(order_uuid::text, 1, 8) || '<br>' ||
                '• Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '<br><br>' ||
                '📦 <strong>TUS PRODUCTOS ESPECÍFICOS:</strong><br>' ||
                replace(COALESCE(products_list, 'Sin productos'), E'\n', '<br>') || '<br><br>' ||
                '💰 <strong>RESUMEN FINANCIERO PARA TI:</strong><br>' ||
                '• Valor total de tus productos: Q' || subtotal || '<br>' ||
                '• <strong>Tus ganancias (90%): Q' || ROUND(subtotal * 0.9, 2) || '</strong><br>' ||
                '• Comisión TASTY (10%): Q' || ROUND(subtotal * 0.1, 2) || '<br>' ||
                '• Tiempo total de preparación: ' || total_hours || ' horas<br><br>' ||
                '👤 <strong>DATOS DEL CLIENTE PARA COORDINACIÓN:</strong><br>' ||
                '• Nombre: ' || order_record.customer_name || '<br>' ||
                '• Teléfono: ' || COALESCE(order_record.customer_phone, 'No especificado') || '<br>' ||
                '• Email: ' || order_record.customer_email || '<br><br>' ||
                '📍 <strong>INFORMACIÓN DE ENTREGA:</strong><br>' ||
                '• Dirección: ' || order_record.full_address || '<br>' ||
                '• Fecha programada: ' || order_record.formatted_delivery || '<br>' ||
                '• Notas especiales: ' || COALESCE(order_record.delivery_notes, 'Sin notas') || '<br><br>' ||
                '📱 <strong>PRÓXIMOS PASOS PARA TI:</strong><br>' ||
                '1. Prepara tus productos según especificaciones<br>' ||
                '2. Coordínate con el cliente si es necesario<br>' ||
                '3. Actualiza el estado en tu panel creador<br>' ||
                '4. Recibirás el pago después de la entrega<br><br>' ||
                '💡 <strong>RECORDATORIO IMPORTANTE:</strong><br>' ||
                '• Debes enviar 10% a TASTY: Q' || ROUND(subtotal * 0.1, 2) || '<br>' ||
                '• Tu ganancia neta: Q' || ROUND(subtotal * 0.9, 2) || '<br><br>' ||
                '¡Gracias por ser parte de TASTY! 🍰<br><br>' ||
                '---<br>' ||
                'Panel Creador: https://tasty.com/creator<br>' ||
                'WhatsApp Soporte: +502 30635323',
        'from', 'TASTY <onboarding@resend.dev>'
      )::text
    ));

    RAISE NOTICE '✅ EMAIL ENVIADO A CREADOR: %', creator_record.creator_name;
    
    -- Delay entre emails de creadores
    PERFORM pg_sleep(1);
  END LOOP;

  RAISE NOTICE '🎉 TODOS LOS EMAILS COMPLETOS ENVIADOS EXITOSAMENTE PARA ORDEN: %', order_uuid;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR ENVIANDO EMAILS COMPLETOS: %', SQLERRM;
END;
$$;

-- =====================================================
-- FUNCIÓN COMPLETA CON INFORMACIÓN DETALLADA
-- - Cliente: Productos, precios, delivery, total
-- - Admin: Control completo, creadores, finanzas
-- - Creador: Sus productos, ganancias 90%, comisión 10%, datos cliente
-- =====================================================

