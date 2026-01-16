-- 🔍 VERIFICAR SI EXISTEN LAS TABLAS DE COMBOS
-- Ejecutar en Supabase SQL Editor

-- Verificar si existe la tabla combos
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('combos', 'combo_items', 'combo_creators')
ORDER BY table_name;

-- Si no aparecen las tablas, significa que hay que crearlas primero
SELECT 'Verificación de tablas completada' as resultado;




