-- =====================================================
-- SISTEMA COMPLETO DE ESTADOS DE PEDIDOS PARA TASTY
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Verificar que la tabla orders tenga todos los campos necesarios
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS previous_status VARCHAR(20);

-- 2. Crear tabla de historial de estados
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- 3. Función para actualizar estado de pedido con validaciones
CREATE OR REPLACE FUNCTION update_order_status(
  order_uuid UUID,
  new_status VARCHAR(20),
  changed_by_uuid UUID DEFAULT NULL,
  status_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status VARCHAR(20);
  order_exists BOOLEAN;
BEGIN
  -- Verificar que el pedido existe
  SELECT status INTO current_status 
  FROM orders 
  WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', order_uuid;
  END IF;

  -- Validar transiciones de estado permitidas
  CASE current_status
    WHEN 'new' THEN
      IF new_status NOT IN ('preparing', 'cancelled') THEN
        RAISE EXCEPTION 'Transición no permitida: % -> %', current_status, new_status;
      END IF;
    WHEN 'preparing' THEN
      IF new_status NOT IN ('ready', 'cancelled') THEN
        RAISE EXCEPTION 'Transición no permitida: % -> %', current_status, new_status;
      END IF;
    WHEN 'ready' THEN
      IF new_status NOT IN ('out_for_delivery', 'cancelled') THEN
        RAISE EXCEPTION 'Transición no permitida: % -> %', current_status, new_status;
      END IF;
    WHEN 'out_for_delivery' THEN
      IF new_status NOT IN ('delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Transición no permitida: % -> %', current_status, new_status;
      END IF;
    WHEN 'delivered' THEN
      -- No se puede cambiar desde entregado
      RAISE EXCEPTION 'No se puede cambiar el estado de un pedido entregado';
    WHEN 'cancelled' THEN
      -- No se puede cambiar desde cancelado
      RAISE EXCEPTION 'No se puede cambiar el estado de un pedido cancelado';
  END CASE;

  -- Actualizar el pedido
  UPDATE orders 
  SET 
    previous_status = current_status,
    status = new_status,
    status_updated_at = NOW(),
    status_updated_by = changed_by_uuid
  WHERE id = order_uuid;

  -- Registrar en historial
  INSERT INTO order_status_history (
    order_id, 
    previous_status, 
    new_status, 
    changed_by, 
    notes
  ) VALUES (
    order_uuid, 
    current_status, 
    new_status, 
    changed_by_uuid, 
    status_notes
  );

  RETURN TRUE;
END;
$$;

-- 4. Función para enviar notificaciones por cambio de estado
CREATE OR REPLACE FUNCTION send_status_change_notifications(
  order_uuid UUID,
  old_status VARCHAR(20),
  new_status VARCHAR(20)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  customer_email TEXT;
  creator_emails TEXT[];
  status_message TEXT;
  email_subject TEXT;
  email_body TEXT;
BEGIN
  -- Obtener datos del pedido
  SELECT 
    o.*,
    u.email as customer_email_addr
  INTO order_record
  FROM orders o
  LEFT JOIN users u ON u.id = o.user_id
  WHERE o.id = order_uuid;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  customer_email := COALESCE(order_record.customer_email, order_record.customer_email_addr);

  -- Obtener emails de creadores
  SELECT array_agg(DISTINCT u.email)
  INTO creator_emails
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN users u ON u.id = p.creator_id
  WHERE oi.order_id = order_uuid
  AND u.email IS NOT NULL;

  -- Generar mensaje según el estado
  CASE new_status
    WHEN 'preparing' THEN
      status_message := 'Tu pedido está siendo preparado';
      email_subject := '👨‍🍳 Tu pedido está en preparación - TASTY #' || SUBSTRING(order_uuid::TEXT, 1, 8);
      email_body := '¡Hola ' || order_record.customer_name || '!

¡Buenas noticias! Tu pedido ya está siendo preparado por nuestros creadores.

📋 Pedido: #' || SUBSTRING(order_uuid::TEXT, 1, 8) || '
👨‍🍳 Estado: En Preparación
⏱️ Tiempo estimado: ' || TO_CHAR(order_record.delivery_date, 'DD/MM/YYYY HH24:MI') || '

Te notificaremos cuando esté listo para entrega.

¡Gracias por elegir TASTY! 🍰';

    WHEN 'ready' THEN
      status_message := 'Tu pedido está listo para entrega';
      email_subject := '✅ Tu pedido está listo - TASTY #' || SUBSTRING(order_uuid::TEXT, 1, 8);
      email_body := '¡Hola ' || order_record.customer_name || '!

¡Tu pedido está listo! 🎉

📋 Pedido: #' || SUBSTRING(order_uuid::TEXT, 1, 8) || '
✅ Estado: Listo para Entrega
🚚 Próximo paso: Nuestro repartidor lo recogerá pronto

Te avisaremos cuando esté en camino.

¡Gracias por tu paciencia! 🍰';

    WHEN 'out_for_delivery' THEN
      status_message := 'Tu pedido está en camino';
      email_subject := '🚚 Tu pedido está en camino - TASTY #' || SUBSTRING(order_uuid::TEXT, 1, 8);
      email_body := '¡Hola ' || order_record.customer_name || '!

¡Tu pedido ya está en camino! 🚚

📋 Pedido: #' || SUBSTRING(order_uuid::TEXT, 1, 8) || '
🚚 Estado: En Camino
📍 Dirección: ' || COALESCE(order_record.delivery_street, 'No especificada') || '
⏰ Llegada estimada: ' || TO_CHAR(order_record.delivery_date, 'DD/MM/YYYY HH24:MI') || '

¡Prepárate para recibir tu deliciosa orden! 🍰';

    WHEN 'delivered' THEN
      status_message := '¡Tu pedido ha sido entregado!';
      email_subject := '🎉 Pedido entregado - TASTY #' || SUBSTRING(order_uuid::TEXT, 1, 8);
      email_body := '¡Hola ' || order_record.customer_name || '!

¡Tu pedido ha sido entregado exitosamente! 🎉

📋 Pedido: #' || SUBSTRING(order_uuid::TEXT, 1, 8) || '
✅ Estado: Entregado
📅 Entregado: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '

¡Esperamos que disfrutes tu deliciosa orden! 

¿Te gustó tu experiencia? ¡Déjanos una reseña!

¡Gracias por elegir TASTY! 🍰';

    WHEN 'cancelled' THEN
      status_message := 'Tu pedido ha sido cancelado';
      email_subject := '❌ Pedido cancelado - TASTY #' || SUBSTRING(order_uuid::TEXT, 1, 8);
      email_body := 'Hola ' || order_record.customer_name || ',

Lamentamos informarte que tu pedido ha sido cancelado.

📋 Pedido: #' || SUBSTRING(order_uuid::TEXT, 1, 8) || '
❌ Estado: Cancelado
📅 Cancelado: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '

Si tienes alguna pregunta, no dudes en contactarnos.

Equipo TASTY 🍰';

    ELSE
      RETURN; -- No enviar email para otros estados
  END CASE;

  -- Enviar email al cliente
  IF customer_email IS NOT NULL THEN
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
  END IF;

  -- Notificar a creadores (solo para ciertos estados)
  IF new_status IN ('preparing', 'ready') AND creator_emails IS NOT NULL THEN
    -- Aquí se pueden enviar notificaciones específicas a creadores
    -- Por ahora solo registramos en logs
    RAISE NOTICE 'Notificando creadores sobre cambio de estado: % -> %', old_status, new_status;
  END IF;

END;
$$;

-- 5. Trigger para enviar notificaciones automáticamente
CREATE OR REPLACE FUNCTION trigger_status_change_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si el estado cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM send_status_change_notifications(NEW.id, OLD.status, NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS notify_status_change ON orders;
CREATE TRIGGER notify_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_status_change_notifications();

-- 6. Función para obtener historial de estados de un pedido
CREATE OR REPLACE FUNCTION get_order_status_history(order_uuid UUID)
RETURNS TABLE(
  status VARCHAR(20),
  changed_at TIMESTAMP,
  changed_by_name TEXT,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    osh.new_status,
    osh.changed_at,
    COALESCE(u.name, 'Sistema') as changed_by_name,
    osh.notes
  FROM order_status_history osh
  LEFT JOIN users u ON u.id = osh.changed_by
  WHERE osh.order_id = order_uuid
  ORDER BY osh.changed_at ASC;
END;
$$;

-- 7. Función para obtener estadísticas de estados
CREATE OR REPLACE FUNCTION get_order_status_stats(creator_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  status VARCHAR(20),
  count BIGINT,
  total_value DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF creator_uuid IS NOT NULL THEN
    -- Estadísticas para un creador específico
    RETURN QUERY
    SELECT 
      o.status,
      COUNT(*) as count,
      SUM(o.total) as total_value
    FROM orders o
    WHERE EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = o.id AND p.creator_id = creator_uuid
    )
    GROUP BY o.status
    ORDER BY 
      CASE o.status
        WHEN 'new' THEN 1
        WHEN 'preparing' THEN 2
        WHEN 'ready' THEN 3
        WHEN 'out_for_delivery' THEN 4
        WHEN 'delivered' THEN 5
        WHEN 'cancelled' THEN 6
      END;
  ELSE
    -- Estadísticas globales
    RETURN QUERY
    SELECT 
      o.status,
      COUNT(*) as count,
      SUM(o.total) as total_value
    FROM orders o
    GROUP BY o.status
    ORDER BY 
      CASE o.status
        WHEN 'new' THEN 1
        WHEN 'preparing' THEN 2
        WHEN 'ready' THEN 3
        WHEN 'out_for_delivery' THEN 4
        WHEN 'delivered' THEN 5
        WHEN 'cancelled' THEN 6
      END;
  END IF;
END;
$$;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- 
-- 1. CAMBIAR ESTADO:
--    SELECT update_order_status('uuid-del-pedido', 'preparing', 'uuid-del-usuario');
--
-- 2. VER HISTORIAL:
--    SELECT * FROM get_order_status_history('uuid-del-pedido');
--
-- 3. VER ESTADÍSTICAS:
--    SELECT * FROM get_order_status_stats(); -- Global
--    SELECT * FROM get_order_status_stats('uuid-del-creador'); -- Por creador
--
-- 4. FLUJO DE ESTADOS PERMITIDOS:
--    new -> preparing -> ready -> out_for_delivery -> delivered
--    Cualquier estado -> cancelled (excepto delivered)
--
-- 5. NOTIFICACIONES AUTOMÁTICAS:
--    Se envían emails automáticamente al cambiar estados
-- =====================================================
