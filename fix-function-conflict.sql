-- =====================================================
-- RESOLVER CONFLICTO DE FUNCIONES DUPLICADAS
-- =====================================================

-- 1. Eliminar la función duplicada más simple
DROP FUNCTION IF EXISTS update_order_status(UUID, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS is_valid_status_transition(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_orders(UUID);
DROP FUNCTION IF EXISTS get_order_items(UUID);
DROP FUNCTION IF EXISTS can_cancel_order(UUID);
DROP FUNCTION IF EXISTS get_creator_order_stats(UUID);

-- 2. Mantener solo la función completa que ya existe en create-order-status-system.sql
-- (No necesitamos recrearla, ya existe)

-- 3. Crear las funciones que SÍ necesitamos para el panel de usuarios
CREATE OR REPLACE FUNCTION get_user_orders_with_items(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  total DECIMAL,
  status VARCHAR(20),
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

-- 4. Función para obtener items de un pedido específico
CREATE OR REPLACE FUNCTION get_order_items_detailed(order_uuid UUID)
RETURNS TABLE (
  product_name_es TEXT,
  quantity INTEGER,
  unit_price DECIMAL,
  total_price DECIMAL
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

-- 5. Función para verificar si un pedido puede ser cancelado (48 horas antes)
CREATE OR REPLACE FUNCTION can_user_cancel_order(order_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  delivery_date TIMESTAMPTZ;
  order_status VARCHAR(20);
  order_user_id UUID;
  hours_until_delivery NUMERIC;
BEGIN
  -- Obtener datos del pedido
  SELECT o.delivery_date, o.status, o.user_id
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

-- 6. Función para cancelar pedido por parte del usuario
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

-- 7. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_user_orders_with_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_items_detailed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_cancel_order(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_user_order(UUID, UUID) TO authenticated;

-- 8. Comentarios
COMMENT ON FUNCTION get_user_orders_with_items IS 'Obtiene todos los pedidos de un usuario con detalles completos';
COMMENT ON FUNCTION get_order_items_detailed IS 'Obtiene los items de un pedido con precios calculados';
COMMENT ON FUNCTION can_user_cancel_order IS 'Verifica si un usuario puede cancelar su pedido (48h + validaciones)';
COMMENT ON FUNCTION cancel_user_order IS 'Cancela un pedido del usuario con todas las validaciones';




