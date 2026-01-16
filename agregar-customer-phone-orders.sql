-- 📞 AGREGAR COLUMNA customer_phone A TABLA ORDERS
-- Para resolver error 400 al crear órdenes

-- ========================================
-- AGREGAR COLUMNA customer_phone
-- ========================================
ALTER TABLE orders 
ADD COLUMN customer_phone VARCHAR(20);

-- ========================================
-- VERIFICAR QUE SE AGREGÓ CORRECTAMENTE
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'customer_phone'
  AND table_schema = 'public';

-- ========================================
-- OPCIONAL: AGREGAR COMENTARIO A LA COLUMNA
-- ========================================
COMMENT ON COLUMN orders.customer_phone IS 'Teléfono del cliente para coordinar entrega y WhatsApp';

-- ========================================
-- VERIFICACIÓN FINAL: MOSTRAR ÚLTIMAS COLUMNAS
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position DESC
LIMIT 5;
