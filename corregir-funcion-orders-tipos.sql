-- =====================================================
-- CORREGIR FUNCIÓN get_user_orders_with_breakdown
-- Resolver error 42804: incompatibilidad de tipos
-- =====================================================

-- 🔍 PROBLEMA IDENTIFICADO:
-- payment_method está definido como VARCHAR(50) en la tabla
-- pero la función lo espera como TEXT (columna 13)

-- ✅ SOLUCIÓN: Recrear función con tipos correctos
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
  payment_method VARCHAR(50),  -- 🔧 CORREGIDO: VARCHAR(50) en lugar de TEXT
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
    COALESCE(o.payment_method, 'cash'::VARCHAR(50)) as payment_method,  -- 🔧 CORREGIDO: Casting correcto
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
-- VERIFICAR QUE LA FUNCIÓN SE CREÓ CORRECTAMENTE
-- =====================================================
SELECT 
  routine_name,
  routine_type,
  data_type,
  is_deterministic
FROM information_schema.routines 
WHERE routine_name = 'get_user_orders_with_breakdown'
  AND routine_schema = 'public';

-- =====================================================
-- PROBAR LA FUNCIÓN (opcional - solo si hay datos)
-- =====================================================
-- SELECT * FROM get_user_orders_with_breakdown('31f72af9-2f48-4cbc-928d-4b88902b44c4'::UUID) LIMIT 1;

-- =====================================================
-- RESULTADO ESPERADO:
-- ✅ Función recreada sin errores de tipos
-- ✅ payment_method ahora es VARCHAR(50) como en la tabla
-- ✅ Error 42804 resuelto
-- =====================================================
