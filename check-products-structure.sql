-- Ver estructura completa de la tabla products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Ver algunos registros de ejemplo para entender la estructura
SELECT * FROM products LIMIT 3;





