-- 🔧 RESOLVER CONFLICTO DE FUNCIONES DE PRIVACIDAD
-- Ejecutar ANTES de fix-missing-privacy-functions.sql

-- Eliminar funciones conflictivas
DROP FUNCTION IF EXISTS get_user_privacy_status(uuid);
DROP FUNCTION IF EXISTS delete_user_personal_data(uuid);
DROP FUNCTION IF EXISTS get_user_order_stats(uuid);

-- Ahora puedes ejecutar fix-missing-privacy-functions.sql sin conflictos
SELECT 'Funciones de privacidad conflictivas eliminadas - Ahora ejecuta fix-missing-privacy-functions.sql' as resultado;





