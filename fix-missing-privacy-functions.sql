-- 🔧 CREAR FUNCIONES FALTANTES PARA PRIVACIDAD
-- Ejecutar en Supabase SQL Editor

-- 1. Función para obtener estado de privacidad del usuario
CREATE OR REPLACE FUNCTION get_user_privacy_status(user_id UUID)
RETURNS TABLE (
  has_saved_address BOOLEAN,
  has_saved_location BOOLEAN,
  total_orders INTEGER,
  pending_orders INTEGER,
  last_order_date TIMESTAMP WITH TIME ZONE,
  can_delete_data BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Verificar si tiene dirección guardada
    CASE 
      WHEN u.street IS NOT NULL AND u.street != '' THEN true
      ELSE false
    END as has_saved_address,
    
    -- Verificar si tiene geolocalización guardada
    CASE 
      WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL THEN true
      ELSE false
    END as has_saved_location,
    
    -- Contar pedidos totales
    COALESCE(order_stats.total_orders, 0)::INTEGER as total_orders,
    
    -- Contar pedidos pendientes
    COALESCE(order_stats.pending_orders, 0)::INTEGER as pending_orders,
    
    -- Fecha del último pedido
    order_stats.last_order_date,
    
    -- Puede eliminar datos (no tiene pedidos pendientes)
    CASE 
      WHEN COALESCE(order_stats.pending_orders, 0) = 0 THEN true
      ELSE false
    END as can_delete_data
    
  FROM users u
  LEFT JOIN (
    SELECT 
      o.user_id,
      COUNT(*) as total_orders,
      COUNT(CASE WHEN o.status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as pending_orders,
      MAX(o.created_at) as last_order_date
    FROM orders o
    WHERE o.user_id = get_user_privacy_status.user_id
    GROUP BY o.user_id
  ) order_stats ON u.id = order_stats.user_id
  WHERE u.id = get_user_privacy_status.user_id;
END;
$$;

-- 2. Función para eliminar datos personales del usuario
CREATE OR REPLACE FUNCTION delete_user_personal_data(user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  deleted_fields TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_orders_count INTEGER;
  deleted_fields_array TEXT[] := '{}';
BEGIN
  -- Verificar si tiene pedidos pendientes
  SELECT COUNT(*) INTO pending_orders_count
  FROM orders 
  WHERE user_id = delete_user_personal_data.user_id 
    AND status IN ('pending', 'confirmed', 'preparing', 'ready');
  
  -- Si tiene pedidos pendientes, no permitir eliminación
  IF pending_orders_count > 0 THEN
    RETURN QUERY SELECT 
      false as success,
      'No se pueden eliminar los datos mientras tengas pedidos pendientes' as message,
      '{}'::TEXT[] as deleted_fields;
    RETURN;
  END IF;
  
  -- Eliminar datos personales
  UPDATE users 
  SET 
    street = CASE WHEN street IS NOT NULL THEN NULL ELSE street END,
    city = CASE WHEN city IS NOT NULL THEN NULL ELSE city END,
    state = CASE WHEN state IS NOT NULL THEN NULL ELSE state END,
    zip = CASE WHEN zip IS NOT NULL THEN NULL ELSE zip END,
    country = CASE WHEN country IS NOT NULL THEN 'Guatemala' ELSE country END,
    latitude = NULL,
    longitude = NULL,
    updated_at = NOW()
  WHERE id = delete_user_personal_data.user_id;
  
  -- Construir array de campos eliminados
  SELECT ARRAY(
    SELECT field_name 
    FROM (
      VALUES 
        ('street'), ('city'), ('state'), ('zip'), 
        ('latitude'), ('longitude')
    ) AS fields(field_name)
  ) INTO deleted_fields_array;
  
  RETURN QUERY SELECT 
    true as success,
    'Datos personales eliminados exitosamente' as message,
    deleted_fields_array as deleted_fields;
END;
$$;

-- 3. Función para obtener estadísticas de pedidos del usuario
CREATE OR REPLACE FUNCTION get_user_order_stats(user_id UUID)
RETURNS TABLE (
  total_orders INTEGER,
  completed_orders INTEGER,
  cancelled_orders INTEGER,
  total_spent DECIMAL(10,2),
  average_order_value DECIMAL(10,2),
  last_order_date TIMESTAMP WITH TIME ZONE,
  favorite_creators TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_orders,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END)::INTEGER as completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END)::INTEGER as cancelled_orders,
    COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as total_spent,
    COALESCE(AVG(CASE WHEN o.status = 'delivered' THEN o.total ELSE NULL END), 0) as average_order_value,
    MAX(o.created_at) as last_order_date,
    ARRAY(
      SELECT DISTINCT u.name 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON p.creator_id = u.id
      WHERE oi.order_id IN (
        SELECT id FROM orders WHERE user_id = get_user_order_stats.user_id
      )
      ORDER BY u.name
      LIMIT 5
    ) as favorite_creators
  FROM orders o
  WHERE o.user_id = get_user_order_stats.user_id;
END;
$$;

-- 4. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_user_privacy_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_personal_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_order_stats(UUID) TO authenticated;

-- ✅ FUNCIONES DE PRIVACIDAD CREADAS EXITOSAMENTE
SELECT 'Funciones de privacidad creadas exitosamente' as resultado;




