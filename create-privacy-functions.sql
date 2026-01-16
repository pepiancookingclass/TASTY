-- =====================================================
-- FUNCIONES DE PRIVACIDAD PARA TASTY
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar campos de privacidad a la tabla orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS save_location_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_delete_after_delivery BOOLEAN DEFAULT false;

-- 2. Función para eliminar datos de ubicación cuando se entrega el pedido
CREATE OR REPLACE FUNCTION cleanup_location_data_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si el estado cambió a 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    
    -- Si el usuario eligió eliminar datos automáticamente
    IF NEW.auto_delete_after_delivery = true THEN
      
      -- Eliminar datos de ubicación del pedido
      UPDATE orders 
      SET 
        delivery_latitude = NULL,
        delivery_longitude = NULL,
        delivery_street = NULL,
        delivery_city = NULL,
        delivery_state = NULL,
        delivery_notes = NULL
      WHERE id = NEW.id;
      
      -- Si NO eligió guardar datos, también eliminar del perfil
      IF NEW.save_location_data = false THEN
        UPDATE users 
        SET 
          latitude = NULL,
          longitude = NULL,
          address_street = NULL,
          address_city = NULL,
          address_state = NULL,
          address_zip = NULL,
          address_country = NULL
        WHERE id = NEW.user_id;
      END IF;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Crear el trigger para eliminar datos automáticamente
DROP TRIGGER IF EXISTS cleanup_location_on_delivery ON orders;
CREATE TRIGGER cleanup_location_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_location_data_on_delivery();

-- 4. Función para que el usuario elimine manualmente sus datos (opcional)
CREATE OR REPLACE FUNCTION delete_user_location_data(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar datos de ubicación del perfil
  UPDATE users 
  SET 
    latitude = NULL,
    longitude = NULL,
    address_street = NULL,
    address_city = NULL,
    address_state = NULL,
    address_zip = NULL,
    address_country = NULL,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Eliminar datos de ubicación de pedidos no entregados
  UPDATE orders 
  SET 
    delivery_latitude = NULL,
    delivery_longitude = NULL,
    delivery_street = NULL,
    delivery_city = NULL,
    delivery_state = NULL,
    delivery_notes = NULL
  WHERE user_id = user_uuid 
  AND status NOT IN ('delivered', 'cancelled');
END;
$$;

-- 5. Función para verificar qué datos tiene guardados un usuario
CREATE OR REPLACE FUNCTION get_user_privacy_status(user_uuid UUID)
RETURNS TABLE(
  has_location_data BOOLEAN,
  has_address_data BOOLEAN,
  pending_orders_with_location INTEGER,
  delivered_orders_with_location INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (u.latitude IS NOT NULL AND u.longitude IS NOT NULL) as has_location_data,
    (u.address_street IS NOT NULL OR u.address_city IS NOT NULL) as has_address_data,
    (SELECT COUNT(*)::INTEGER FROM orders o WHERE o.user_id = user_uuid AND o.status NOT IN ('delivered', 'cancelled') AND (o.delivery_latitude IS NOT NULL OR o.delivery_longitude IS NOT NULL)) as pending_orders_with_location,
    (SELECT COUNT(*)::INTEGER FROM orders o WHERE o.user_id = user_uuid AND o.status = 'delivered' AND (o.delivery_latitude IS NOT NULL OR o.delivery_longitude IS NOT NULL)) as delivered_orders_with_location
  FROM users u 
  WHERE u.id = user_uuid;
END;
$$;

-- =====================================================
-- COMENTARIOS SOBRE PRIVACIDAD:
-- 
-- 1. DATOS TEMPORALES: Si auto_delete_after_delivery = true,
--    los datos se eliminan automáticamente al entregar
--
-- 2. DATOS GUARDADOS: Si save_location_data = true,
--    los datos se mantienen en el perfil para futuros pedidos
--
-- 3. MÁXIMA PRIVACIDAD: auto_delete = true + save_data = false
--    = datos se eliminan completamente después de entrega
--
-- 4. CONVENIENCIA: save_data = true + auto_delete = false
--    = datos se guardan permanentemente para rapidez
--
-- 5. HÍBRIDO: save_data = true + auto_delete = true
--    = se guarda temporalmente, se elimina después de entrega
-- =====================================================




