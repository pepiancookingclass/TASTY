-- =====================================================
-- COMPLETAR EMAILS DE CREADORES CON DATOS FINANCIEROS
-- =====================================================

CREATE OR REPLACE FUNCTION send_creator_emails(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
  order_record RECORD;
  creator_record RECORD;
  creator_products_list TEXT;
  creator_subtotal DECIMAL;
  creator_total_hours INTEGER;
  order_iva DECIMAL;
BEGIN
  -- Obtener datos de la orden
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

  -- Calcular IVA total del pedido
  order_iva := COALESCE(order_record.iva_amount, order_record.subtotal * 0.12);

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
      COALESCE(string_agg(
        '• ' || p.name_es || 
        ' (Cantidad: ' || oi.quantity || ')' ||
        ' - Q' || (oi.quantity * oi.unit_price) ||
        ' | Tiempo: ' || COALESCE(p.preparation_time, 0) || 'h',
        E'\n'
      ), 'Sin productos'),
      SUM(oi.quantity * oi.unit_price),
      SUM(COALESCE(p.preparation_time, 0) * oi.quantity)
    INTO creator_products_list, creator_subtotal, creator_total_hours
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid 
    AND p.creator_id = creator_record.creator_id;

    -- Enviar email completo al creador
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
        'subject', '🍳 [CREADOR] Nuevo Pedido para ' || creator_record.creator_name || ' #' || SUBSTRING(order_uuid::text, 1, 8),
        'html', '¡Hola ' || creator_record.creator_name || '!<br><br>' ||
                '🎉 <strong>¡Tienes un nuevo pedido!</strong><br><br>' ||
                '📋 <strong>DETALLES DEL PEDIDO:</strong><br>' ||
                '• Número: #' || SUBSTRING(order_uuid::text, 1, 8) || '<br>' ||
                '• Fecha: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '<br>' ||
                '• Cliente: ' || order_record.customer_name || '<br>' ||
                '• Teléfono cliente: ' || COALESCE(order_record.customer_phone, 'No especificado') || '<br><br>' ||
                
                '📦 <strong>TUS PRODUCTOS ESPECÍFICOS:</strong><br>' ||
                replace(creator_products_list, E'\n', '<br>') || '<br><br>' ||
                
                '💰 <strong>RESUMEN FINANCIERO PARA TI:</strong><br>' ||
                '• Valor de tus productos: Q' || creator_subtotal || '<br>' ||
                '• <strong>Tu ganancia (90%): Q' || ROUND(creator_subtotal * 0.9, 2) || '</strong><br>' ||
                '• Comisión TASTY (10%): Q' || ROUND(creator_subtotal * 0.1, 2) || '<br>' ||
                '• Tiempo de preparación: ' || creator_total_hours || ' horas<br><br>' ||
                
                '📊 <strong>CONTEXTO DEL PEDIDO COMPLETO:</strong><br>' ||
                '• Total general del pedido: Q' || order_record.total || '<br>' ||
                '• IVA incluido en pedido: Q' || ROUND(order_iva, 2) || '<br>' ||
                '• Delivery fee: Q' || COALESCE(order_record.delivery_fee, 0) || '<br><br>' ||
                
                '📍 <strong>INFORMACIÓN DE ENTREGA:</strong><br>' ||
                '• Dirección: ' || order_record.full_address || '<br>' ||
                '• Fecha estimada: ' || order_record.formatted_delivery || '<br>' ||
                '• Notas especiales: ' || COALESCE(order_record.delivery_notes, 'Sin notas') || '<br><br>' ||
                
                '📱 <strong>PRÓXIMOS PASOS PARA TI:</strong><br>' ||
                '1. Prepara tus productos según especificaciones<br>' ||
                '2. <strong>La fecha y hora exacta de entrega se acordará con nuestro agente de servicio al cliente</strong><br>' ||
                '3. Actualiza el estado en tu panel creador cuando esté listo<br>' ||
                '4. Recibirás el pago después de la entrega confirmada<br><br>' ||
                
                '⚠️ <strong>NOTA IMPORTANTE:</strong><br>' ||
                'La fecha mostrada arriba es estimada (48h mínimas). Nuestro agente de servicio al cliente coordinará contigo la fecha y hora exacta de entrega según tu disponibilidad y la del cliente.<br><br>' ||
                
                '💡 <strong>RECORDATORIO FINANCIERO:</strong><br>' ||
                '• Debes transferir 10% a TASTY: Q' || ROUND(creator_subtotal * 0.1, 2) || '<br>' ||
                '• Tu ganancia neta final: Q' || ROUND(creator_subtotal * 0.9, 2) || '<br><br>' ||
                
                '¡Gracias por ser parte de TASTY! 🍰<br><br>' ||
                '---<br>' ||
                'Panel Creador: https://tasty.com/creator<br>' ||
                'WhatsApp Soporte: +502 30635323<br>' ||
                'Equipo TASTY',
        'from', 'TASTY <onboarding@resend.dev>'
      )::text
    ));

    PERFORM pg_sleep(1);
  END LOOP;
END;
$$;

