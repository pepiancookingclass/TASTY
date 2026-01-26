-- 🔧 ARREGLAR ENUM DE ORDER_STATUS
-- Ejecutar en Supabase SQL Editor

-- 1. Ver valores actuales del enum
SELECT unnest(enum_range(NULL::order_status)) as status_values;

-- 2. Agregar 'pending' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending' AND enumtypid = 'order_status'::regtype) THEN
        ALTER TYPE order_status ADD VALUE 'pending';
    END IF;
END$$;

-- 3. Verificar que se agregó
SELECT unnest(enum_range(NULL::order_status)) as status_values;

SELECT 'Enum order_status actualizado con pending' as resultado;





