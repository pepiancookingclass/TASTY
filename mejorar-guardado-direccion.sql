-- =====================================================
-- MEJORAR GUARDADO AUTOMÁTICO DE DIRECCIÓN
-- Siempre guardar dirección después de crear pedido
-- =====================================================

-- Función mejorada para guardar dirección automáticamente
CREATE OR REPLACE FUNCTION save_user_address_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_address RECORD;
  should_update BOOLEAN := false;
BEGIN
  -- Obtener dirección actual del usuario
  SELECT address_street, address_city, address_state
  INTO current_address
  FROM users 
  WHERE id = NEW.user_id;

  -- Determinar si debemos actualizar
  should_update := (
    -- Si no tiene dirección guardada
    (current_address.address_street IS NULL OR current_address.address_street = '') OR
    (current_address.address_city IS NULL OR current_address.address_city = '') OR
    (current_address.address_state IS NULL OR current_address.address_state = '') OR
    -- Si la dirección del pedido es diferente y más completa
    (NEW.delivery_street IS NOT NULL AND NEW.delivery_street != '' AND 
     NEW.delivery_street != current_address.address_street) OR
    (NEW.delivery_city IS NOT NULL AND NEW.delivery_city != '' AND 
     NEW.delivery_city != current_address.address_city) OR
    (NEW.delivery_state IS NOT NULL AND NEW.delivery_state != '' AND 
     NEW.delivery_state != current_address.address_state)
  );

  -- Actualizar dirección si es necesario
  IF should_update THEN
    UPDATE users 
    SET 
      address_street = COALESCE(NULLIF(NEW.delivery_street, ''), address_street),
      address_city = COALESCE(NULLIF(NEW.delivery_city, ''), address_city),
      address_state = COALESCE(NULLIF(NEW.delivery_state, ''), address_state),
      updated_at = NOW()
    WHERE id = NEW.user_id;

    RAISE NOTICE '📍 Dirección actualizada automáticamente para usuario: % | Calle: % | Ciudad: % | Estado: %', 
                 NEW.user_id, NEW.delivery_street, NEW.delivery_city, NEW.delivery_state;
  ELSE
    RAISE NOTICE '📍 Dirección no actualizada - ya existe o es igual para usuario: %', NEW.user_id;
  END IF;
  
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
-- FUNCIONALIDAD:
-- 1. Siempre revisa si debe actualizar la dirección
-- 2. Actualiza solo si no existe o es diferente
-- 3. Preserva datos existentes si los nuevos están vacíos
-- 4. Logs detallados para debugging
-- =====================================================

