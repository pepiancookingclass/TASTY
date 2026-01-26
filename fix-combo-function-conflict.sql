-- 🔧 RESOLVER CONFLICTO DE FUNCIONES DE COMBOS
-- Ejecutar ANTES de create-combos-system.sql

-- Eliminar funciones conflictivas
DROP FUNCTION IF EXISTS get_combo_details(uuid);
DROP FUNCTION IF EXISTS get_active_combos();
DROP FUNCTION IF EXISTS get_creator_combos(uuid);
DROP FUNCTION IF EXISTS create_combo(UUID, JSONB, JSONB, TEXT, TEXT, DECIMAL, INTEGER, TEXT, INTEGER, TIMESTAMP WITH TIME ZONE, INTEGER, JSONB);

-- Ahora puedes ejecutar create-combos-system.sql sin conflictos
SELECT 'Funciones conflictivas eliminadas - Ahora ejecuta create-combos-system.sql' as resultado;





