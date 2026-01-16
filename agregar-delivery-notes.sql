-- 📝 AGREGAR COLUMNA delivery_notes A TABLA ORDERS
-- Para guardar instrucciones especiales de entrega

-- ========================================
-- AGREGAR COLUMNA delivery_notes
-- ========================================
ALTER TABLE orders 
ADD COLUMN delivery_notes TEXT;

-- ========================================
-- AGREGAR COMENTARIO A LA COLUMNA
-- ========================================
COMMENT ON COLUMN orders.delivery_notes IS 'Instrucciones especiales para la entrega del pedido';

-- ========================================
-- VERIFICAR QUE SE AGREGÓ CORRECTAMENTE
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'delivery_notes'
  AND table_schema = 'public';

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
LIMIT 8;
