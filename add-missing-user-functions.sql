-- =====================================================
-- AGREGAR SOLO LAS FUNCIONES QUE FALTAN PARA USUARIOS
-- (Sin tocar las funciones existentes del sistema)
-- =====================================================

-- 1. Función para obtener pedidos de un usuario (compatible con la estructura actual)
CREATE OR REPLACE FUNCTION get_user_orders_complete(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  total NUMERIC,
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
    o.status::TEXT,  -- Convertir USER-DEFINED a TEXT
    o.created_at,
    o.delivery_date,
    o.delivery_street,
    o.delivery_city,
    o.delivery_state,
    'cash'::TEXT as payment_method  -- Valor por defecto hasta que agregues esta columna
  FROM orders o
  WHERE o.user_id = user_uuid
  ORDER BY o.created_at DESC;
END;
$$;

-- 2. Función para obtener items de un pedido
CREATE OR REPLACE FUNCTION get_order_items_complete(order_uuid UUID)
RETURNS TABLE (
  product_name_es TEXT,
  quantity INTEGER,
  unit_price NUMERIC,
  total_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_name_es,
    oi.quantity,
    oi.unit_price,
    (oi.quantity * oi.unit_price) as total_price
  FROM order_items oi
  WHERE oi.order_id = order_uuid
  ORDER BY oi.product_name_es;
END;
$$;

-- 3. Función para verificar si un usuario puede cancelar su pedido
CREATE OR REPLACE FUNCTION can_user_cancel_order(order_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  delivery_date TIMESTAMPTZ;
  order_status TEXT;
  order_user_id UUID;
  hours_until_delivery NUMERIC;
BEGIN
  -- Obtener datos del pedido
  SELECT o.delivery_date, o.status::TEXT, o.user_id
  INTO delivery_date, order_status, order_user_id
  FROM orders o
  WHERE o.id = order_uuid;
  
  -- Verificar que el pedido existe
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que el pedido pertenece al usuario
  IF order_user_id != user_uuid THEN
    RETURN FALSE;
  END IF;
  
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

-- 4. Función para cancelar pedido (usa la función existente update_order_status)
CREATE OR REPLACE FUNCTION cancel_user_order(order_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que se puede cancelar
  IF NOT can_user_cancel_order(order_uuid, user_uuid) THEN
    RAISE EXCEPTION 'No se puede cancelar este pedido. Debe ser con 48 horas de anticipación.';
  END IF;
  
  -- Usar la función existente para actualizar el estado
  RETURN update_order_status(order_uuid, 'cancelled', user_uuid, 'Cancelado por el cliente');
END;
$$;

-- 5. Función para obtener horas restantes hasta poder cancelar
CREATE OR REPLACE FUNCTION get_cancellation_hours_remaining(order_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  delivery_date TIMESTAMPTZ;
  hours_until_delivery NUMERIC;
  hours_until_cancellation_deadline NUMERIC;
BEGIN
  -- Obtener fecha de entrega
  SELECT o.delivery_date
  INTO delivery_date
  FROM orders o
  WHERE o.id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN -1; -- Pedido no encontrado
  END IF;
  
  -- Calcular horas hasta la entrega
  hours_until_delivery := EXTRACT(EPOCH FROM (delivery_date - NOW())) / 3600;
  
  -- Calcular horas hasta el límite de cancelación (48h antes de entrega)
  hours_until_cancellation_deadline := hours_until_delivery - 48;
  
  RETURN hours_until_cancellation_deadline;
END;
$$;

-- 6. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_user_orders_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_items_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_cancel_order(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_user_order(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cancellation_hours_remaining(UUID) TO authenticated;

-- 7. Comentarios
COMMENT ON FUNCTION get_user_orders_complete IS 'Obtiene todos los pedidos de un usuario (compatible con estructura actual)';
COMMENT ON FUNCTION get_order_items_complete IS 'Obtiene los items de un pedido con precios calculados';
COMMENT ON FUNCTION can_user_cancel_order IS 'Verifica si un usuario puede cancelar su pedido (48h + validaciones)';
COMMENT ON FUNCTION cancel_user_order IS 'Cancela un pedido del usuario con todas las validaciones';
COMMENT ON FUNCTION get_cancellation_hours_remaining IS 'Obtiene las horas restantes para poder cancelar un pedido';




