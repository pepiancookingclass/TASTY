-- =====================================================
-- AGREGAR DESGLOSE DE DELIVERY EN ORDERS
-- Campos para subtotal y delivery separados
-- =====================================================

-- 1. Agregar campos para desglose en tabla orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(8, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(8, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_breakdown JSONB DEFAULT '[]'::jsonb;

-- 2. Comentar los campos
COMMENT ON COLUMN orders.subtotal IS 'Subtotal de productos sin delivery';
COMMENT ON COLUMN orders.delivery_fee IS 'Costo total de delivery';
COMMENT ON COLUMN orders.delivery_breakdown IS 'Desglose de delivery por creador: [{"creator_id": "uuid", "creator_name": "Nombre", "delivery_fee": 25.50, "distance_km": 5.2}]';

-- 3. Función para actualizar pedidos existentes con desglose
CREATE OR REPLACE FUNCTION update_existing_orders_with_breakdown()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  order_record RECORD;
  products_subtotal DECIMAL(8, 2);
  calculated_delivery DECIMAL(8, 2);
BEGIN
  -- Actualizar pedidos existentes que no tienen desglose
  FOR order_record IN 
    SELECT id, total, delivery_latitude, delivery_longitude
    FROM orders 
    WHERE subtotal IS NULL OR subtotal = 0
  LOOP
    -- Calcular subtotal de productos
    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    INTO products_subtotal
    FROM order_items oi
    WHERE oi.order_id = order_record.id;
    
    -- Calcular delivery (total - subtotal)
    calculated_delivery := GREATEST(order_record.total - products_subtotal, 0);
    
    -- Actualizar el pedido
    UPDATE orders 
    SET 
      subtotal = products_subtotal,
      delivery_fee = calculated_delivery,
      delivery_breakdown = CASE 
        WHEN calculated_delivery > 0 THEN 
          '[{"creator_name": "Delivery calculado", "delivery_fee": ' || calculated_delivery || ', "distance_km": 0}]'::jsonb
        ELSE '[]'::jsonb
      END
    WHERE id = order_record.id;
    
    RAISE NOTICE '📊 Pedido % actualizado: Subtotal Q% + Delivery Q% = Total Q%', 
                 order_record.id, products_subtotal, calculated_delivery, order_record.total;
  END LOOP;
  
  RAISE NOTICE '✅ Todos los pedidos existentes actualizados con desglose';
END;
$$;

-- 4. Ejecutar actualización de pedidos existentes
SELECT update_existing_orders_with_breakdown();

-- 5. Función para obtener pedidos con desglose completo
CREATE OR REPLACE FUNCTION get_user_orders_with_breakdown(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  total DECIMAL(8, 2),
  subtotal DECIMAL(8, 2),
  delivery_fee DECIMAL(8, 2),
  delivery_breakdown JSONB,
  status TEXT,
  created_at TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  delivery_street TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  payment_method TEXT,
  items JSONB
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
    COALESCE(o.subtotal, 0.00) as subtotal,
    COALESCE(o.delivery_fee, 0.00) as delivery_fee,
    COALESCE(o.delivery_breakdown, '[]'::jsonb) as delivery_breakdown,
    o.status,
    o.created_at,
    o.delivery_date,
    o.delivery_street,
    o.delivery_city,
    o.delivery_state,
    o.payment_method,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'product_name_es', p.name_es,
          'quantity', oi.quantity,
          'unit_price', oi.price_at_purchase,
          'creator_name', u.name
        )
      ) FILTER (WHERE oi.id IS NOT NULL), 
      '[]'::jsonb
    ) as items
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  LEFT JOIN users u ON p.creator_id = u.id
  WHERE o.user_id = user_uuid
  GROUP BY o.id, o.customer_name, o.total, o.subtotal, o.delivery_fee, 
           o.delivery_breakdown, o.status, o.created_at, o.delivery_date,
           o.delivery_street, o.delivery_city, o.delivery_state, o.payment_method
  ORDER BY o.created_at DESC;
END;
$$;

-- =====================================================
-- CAMPOS AGREGADOS:
-- - subtotal: Suma de productos sin delivery
-- - delivery_fee: Costo total de delivery  
-- - delivery_breakdown: JSON con desglose por creador
--
-- FUNCIONES CREADAS:
-- - update_existing_orders_with_breakdown(): Actualiza pedidos existentes
-- - get_user_orders_with_breakdown(): Obtiene pedidos con desglose completo
-- =====================================================
