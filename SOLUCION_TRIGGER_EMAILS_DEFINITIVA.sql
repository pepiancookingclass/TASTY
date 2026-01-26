-- =====================================================
-- SOLUCIÓN DEFINITIVA: TRIGGER DE EMAILS NO FUNCIONA
-- PROBLEMA: Conflicto de nombres entre funciones
-- =====================================================

-- 1. VERIFICAR QUE FUNCIONES EXISTEN ACTUALMENTE
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%trigger%email%' OR routine_name LIKE '%send%email%'
ORDER BY routine_name;

-- 2. VERIFICAR TRIGGER ACTUAL
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders' 
AND trigger_name LIKE '%email%';

-- 3. LIMPIAR COMPLETAMENTE (EMPEZAR DE CERO)
DROP TRIGGER IF EXISTS send_emails_on_order_creation ON orders;
DROP FUNCTION IF EXISTS trigger_send_emails();
DROP FUNCTION IF EXISTS trigger_order_emails();

-- 4. CREAR FUNCIÓN SIMPLE QUE FUNCIONE
CREATE OR REPLACE FUNCTION trigger_send_order_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log para debug
  RAISE NOTICE 'TRIGGER EJECUTADO: Orden % creada, enviando emails...', NEW.id;
  
  -- Llamar función que sabemos que funciona
  PERFORM send_order_confirmation_email(NEW.id);
  
  -- Log de éxito
  RAISE NOTICE 'TRIGGER COMPLETADO: Emails enviados para orden %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero NO fallar el insert
    RAISE NOTICE 'ERROR EN TRIGGER: % - Orden % creada pero emails fallaron', SQLERRM, NEW.id;
    RETURN NEW;
END;
$$;

-- 5. CREAR TRIGGER CON NOMBRE ÚNICO
CREATE TRIGGER send_order_emails_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_order_emails();

-- 6. VERIFICAR QUE QUEDÓ BIEN
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders';

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecutar este SQL en Supabase SQL Editor
-- 2. Crear una orden desde la app
-- 3. Revisar logs en Supabase > Logs > Postgres Logs
-- 4. Buscar mensajes "TRIGGER EJECUTADO" y "TRIGGER COMPLETADO"
-- =====================================================

/*
🎯 DIAGNÓSTICO DEL PROBLEMA:

❌ PROBLEMA REAL: 
- Múltiples agentes crearon funciones con nombres similares
- Trigger apuntaba a función incorrecta o corrupta
- Conflicto entre trigger_send_emails() vs trigger_order_emails()

✅ SOLUCIÓN:
- Limpiar completamente
- Crear función con nombre único
- Agregar logs para debug
- Exception handling para no romper inserts

🧪 CÓMO PROBAR:
1. Ejecutar este SQL
2. Crear orden desde app
3. Ver logs en Supabase
4. Confirmar que aparecen mensajes del trigger

💡 POR QUÉ FALLÓ ANTES:
- Los agentes probaron TODO excepto verificar el nombre exacto de la función
- Asumieron que el trigger existía sin verificar la función específica
- No limpiaron conflictos de versiones anteriores
*/

