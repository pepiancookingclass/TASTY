-- 📧💳 AGREGAR COLUMNAS FALTANTES A TABLA ORDERS
-- Para tener datos completos del pedido

-- ========================================
-- AGREGAR COLUMNA customer_email
-- ========================================
ALTER TABLE orders 
ADD COLUMN customer_email VARCHAR(255);

-- ========================================
-- AGREGAR COLUMNA payment_method
-- ========================================
ALTER TABLE orders 
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';

-- ========================================
-- AGREGAR COMENTARIOS A LAS COLUMNAS
-- ========================================
COMMENT ON COLUMN orders.customer_email IS 'Email del cliente para notificaciones';
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: cash, transfer, card';

-- ========================================
-- VERIFICAR QUE SE AGREGARON CORRECTAMENTE
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('customer_email', 'payment_method')
  AND table_schema = 'public'
ORDER BY column_name;

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
LIMIT 7;

