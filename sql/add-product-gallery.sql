-- =============================================
-- AGREGAR GALERÍA DE IMÁGENES Y ESTADO AGOTADO A PRODUCTOS
-- =============================================

-- 1. Agregar columna para múltiples imágenes (array)
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- 2. Agregar columna para estado agotado/vendido
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT false;

-- 3. Migrar imagen actual al array (para productos existentes)
UPDATE products 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL 
  AND image_url != '' 
  AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) = 0);

-- 4. Crear índice para búsqueda de productos agotados
CREATE INDEX IF NOT EXISTS idx_products_sold_out ON products(is_sold_out);

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- SELECT id, name_es, image_url, image_urls, is_sold_out FROM products LIMIT 5;
