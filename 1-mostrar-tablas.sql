-- 🔍 SECCIÓN 1: MOSTRAR TODAS LAS TABLAS RELACIONADAS
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'orders', 'user_carts', 'creator_temporary_locations')
ORDER BY table_name;

