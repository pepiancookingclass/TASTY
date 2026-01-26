-- Primero, eliminar funciones duplicadas si existen
DROP FUNCTION IF EXISTS update_order_status(UUID, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS update_order_status(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS update_order_status(UUID, TEXT);
DROP FUNCTION IF EXISTS is_valid_status_transition(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_orders(UUID);
DROP FUNCTION IF EXISTS get_order_items(UUID);
DROP FUNCTION IF EXISTS can_cancel_order(UUID);
DROP FUNCTION IF EXISTS get_creator_order_stats(UUID);

-- Ahora crear las funciones limpias
CREATE OR REPLACE FUNCTION update_order_status(
  order_uuid UUID,
  new_status TEXT,
  changed_by_uuid UUID DEFAULT NULL,
  status_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_exists BOOLEAN;
  current_status TEXT;
BEGIN
  -- Verificar que el pedido existe y obtener el estado actual
  SELECT EXISTS(SELECT 1 FROM orders WHERE id = order_uuid), status
  INTO order_exists, current_status
  FROM orders 
  WHERE id = order_uuid;
  
  IF NOT order_exists THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- No actualizar si el estado es el mismo
  IF current_status = new_status THEN
    RETURN TRUE;
  END IF;
  
  -- Validar transiciones de estado permitidas
  IF NOT is_valid_status_transition(current_status, new_status) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', current_status, new_status;
  END IF;
  
  -- Actualizar el estado del pedido
  UPDATE orders 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- El trigger se encargará de crear el registro en order_status_history
  
  RETURN TRUE;
END;
$$;

-- Función para validar transiciones de estado
CREATE OR REPLACE FUNCTION is_valid_status_transition(
  current_status TEXT,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Permitir cualquier transición a 'cancelled'
  IF new_status = 'cancelled' THEN
    RETURN TRUE;
  END IF;
  
  -- Definir transiciones válidas
  CASE current_status
    WHEN 'new' THEN
      RETURN new_status IN ('preparing', 'cancelled');
    WHEN 'preparing' THEN
      RETURN new_status IN ('ready', 'cancelled');
    WHEN 'ready' THEN
      RETURN new_status IN ('out_for_delivery', 'cancelled');
    WHEN 'out_for_delivery' THEN
      RETURN new_status IN ('delivered', 'cancelled');
    WHEN 'delivered' THEN
      RETURN FALSE; -- No se puede cambiar desde delivered
    WHEN 'cancelled' THEN
      RETURN FALSE; -- No se puede cambiar desde cancelled
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Función para obtener pedidos de un usuario
CREATE OR REPLACE FUNCTION get_user_orders(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  total DECIMAL,
  status TEXT,
  created_at TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  delivery_street TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  payment_method TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_name,
    o.total,
    o.status,
    o.created_at,
    o.delivery_date,
    o.delivery_street,
    o.delivery_city,
    o.delivery_state,
    o.payment_method
  FROM orders o
  WHERE o.user_id = user_uuid
  ORDER BY o.created_at DESC;
END;
$$;

-- Función para obtener items de un pedido
CREATE OR REPLACE FUNCTION get_order_items(order_uuid UUID)
RETURNS TABLE (
  product_name_es TEXT,
  quantity INTEGER,
  unit_price DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_name_es,
    oi.quantity,
    oi.unit_price
  FROM order_items oi
  WHERE oi.order_id = order_uuid
  ORDER BY oi.product_name_es;
END;
$$;

-- Función para verificar si un pedido puede ser cancelado (48 horas antes)
CREATE OR REPLACE FUNCTION can_cancel_order(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  delivery_date TIMESTAMPTZ;
  order_status TEXT;
  hours_until_delivery INTEGER;
BEGIN
  -- Obtener fecha de entrega y estado
  SELECT o.delivery_date, o.status
  INTO delivery_date, order_status
  FROM orders o
  WHERE o.id = order_uuid;
  
  -- No se puede cancelar si ya está entregado o cancelado
  IF order_status IN ('delivered', 'cancelled') THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular horas hasta la entrega
  hours_until_delivery := EXTRACT(EPOCH FROM (delivery_date - NOW())) / 3600;
  
  -- Se puede cancelar si faltan más de 48 horas
  RETURN hours_until_delivery >= 48;
END;
$$;

-- Función para obtener estadísticas de pedidos por estado (para creadores)
CREATE OR REPLACE FUNCTION get_creator_order_stats(creator_uuid UUID)
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  total_amount DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.status,
    COUNT(*) as count,
    COALESCE(SUM(o.total), 0) as total_amount
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  WHERE p.creator_id = creator_uuid
  GROUP BY o.status
  ORDER BY 
    CASE o.status
      WHEN 'new' THEN 1
      WHEN 'preparing' THEN 2
      WHEN 'ready' THEN 3
      WHEN 'out_for_delivery' THEN 4
      WHEN 'delivered' THEN 5
      WHEN 'cancelled' THEN 6
      ELSE 7
    END;
END;
$$;

-- Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION update_order_status(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_status_transition(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_orders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_cancel_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_creator_order_stats(UUID) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION update_order_status IS 'Actualiza el estado de un pedido con validaciones de transición';
COMMENT ON FUNCTION is_valid_status_transition IS 'Valida si una transición de estado es permitida';
COMMENT ON FUNCTION get_user_orders IS 'Obtiene todos los pedidos de un usuario';
COMMENT ON FUNCTION get_order_items IS 'Obtiene los items de un pedido específico';
COMMENT ON FUNCTION can_cancel_order IS 'Verifica si un pedido puede ser cancelado (política de 48 horas)';
COMMENT ON FUNCTION get_creator_order_stats IS 'Obtiene estadísticas de pedidos por estado para un creador';





