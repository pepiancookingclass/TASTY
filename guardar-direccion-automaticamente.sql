-- =====================================================
-- GUARDAR DIRECCIÓN DEL USUARIO AUTOMÁTICAMENTE
-- Actualizar perfil con dirección después de crear pedido
-- =====================================================

-- Función para guardar dirección del usuario después de crear pedido
CREATE OR REPLACE FUNCTION save_user_address_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo guardar si el usuario no tiene dirección guardada o si es diferente
  UPDATE users 
  SET 
    address_street = COALESCE(NEW.delivery_street, address_street),
    address_city = COALESCE(NEW.delivery_city, address_city),
    address_state = COALESCE(NEW.delivery_state, address_state),
    updated_at = NOW()
  WHERE id = NEW.user_id
  AND (
    address_street IS NULL OR address_street = '' OR
    address_city IS NULL OR address_city = '' OR
    address_state IS NULL OR address_state = '' OR
    address_street != NEW.delivery_street OR
    address_city != NEW.delivery_city OR
    address_state != NEW.delivery_state
  );

  RAISE NOTICE '📍 Dirección guardada automáticamente para usuario: %', NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para guardar dirección automáticamente
DROP TRIGGER IF EXISTS save_user_address_on_order ON orders;

CREATE TRIGGER save_user_address_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION save_user_address_from_order();

-- =====================================================
-- TRIGGER AUTOMÁTICO PARA GUARDAR DIRECCIÓN
-- Se ejecuta después de crear cada pedido
-- Solo actualiza si la dirección es nueva o diferente
-- =====================================================
