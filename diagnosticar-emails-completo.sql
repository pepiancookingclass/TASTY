-- =====================================================
-- DIAGNÓSTICO COMPLETO DEL SISTEMA DE EMAILS
-- =====================================================

-- 1. VERIFICAR EDGE FUNCTION EXISTE
SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%email%';

-- 2. PROBAR FUNCIÓN MANUALMENTE CON ORDEN REAL
-- (Reemplazar con UUID de orden real)
DO $$
DECLARE
  test_order_id UUID;
BEGIN
  -- Obtener la orden más reciente
  SELECT id INTO test_order_id FROM orders ORDER BY created_at DESC LIMIT 1;
  
  RAISE NOTICE '🧪 PROBANDO CON ORDEN: %', test_order_id;
  
  -- Probar función
  PERFORM send_order_confirmation_email(test_order_id);
  
  RAISE NOTICE '✅ FUNCIÓN EJECUTADA SIN ERRORES';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR EN FUNCIÓN: %', SQLERRM;
END $$;

-- 3. VERIFICAR PERMISOS DE HTTP
SELECT has_function_privilege('postgres', 'http(http_request)', 'EXECUTE');

-- 4. VERIFICAR EXTENSIÓN HTTP
SELECT * FROM pg_extension WHERE extname = 'http';

-- 5. VER ÓRDENES RECIENTES PARA PROBAR
SELECT 
  id, 
  customer_name, 
  total, 
  created_at,
  status
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

