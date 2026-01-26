-- =====================================================
-- SOLUCIÓN DEFINITIVA: DESHABILITAR TRIGGERS PROBLEMÁTICOS
-- =====================================================
-- 
-- PROBLEMA: Los triggers SQL que usan http() o net.http_post() 
-- NO FUNCIONAN cuando la aplicación usa Connection Pooling (PgBouncer)
-- PERO SÍ funcionan desde SQL Editor porque usa conexión directa.
--
-- SOLUCIÓN: La aplicación ahora llama directamente a la Edge Function
-- después de crear la orden. El trigger ya no es necesario.
--
-- =====================================================

-- 1. DESHABILITAR TRIGGER DE EMAILS EN ORDERS
-- Este trigger nunca funcionó desde la app por el connection pooling
DROP TRIGGER IF EXISTS send_emails_on_order_creation ON orders;
DROP TRIGGER IF EXISTS send_order_emails_trigger ON orders;

-- 2. VERIFICAR QUE NO QUEDAN TRIGGERS DE EMAIL
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders';

-- 3. MANTENER LAS FUNCIONES SQL PARA USO MANUAL
-- Estas funciones siguen funcionando desde SQL Editor si algún día
-- necesitas probar o enviar emails manualmente.
-- NO LAS ELIMINAMOS porque funcionan bien cuando se llaman directamente.

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Listar todos los triggers en la tabla orders (debería estar vacío o sin triggers de email)
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'orders'
ORDER BY trigger_name;

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecutar este SQL en Supabase SQL Editor
-- 2. Desplegar la nueva Edge Function:
--    supabase functions deploy send-email --project-ref aitmxnfljglwpkpibgek
-- 3. Probar crear una orden desde la aplicación
-- 4. Verificar que los emails lleguen
-- =====================================================

/*
EXPLICACIÓN TÉCNICA DEL PROBLEMA:

1. Supabase usa PgBouncer como connection pooler
2. PgBouncer opera en modo "transaction" por defecto
3. Las funciones SQL que hacen llamadas HTTP (http() o net.http_post())
   fallan silenciosamente cuando se ejecutan a través del pooler
4. Desde SQL Editor funciona porque usa una conexión directa a PostgreSQL

NUEVA ARQUITECTURA:

ANTES (NO FUNCIONABA):
App → INSERT orders → Trigger AFTER INSERT → función SQL → http() → ❌ FALLA

AHORA (FUNCIONA):
App → INSERT orders → ✅ ÉXITO → fetch() a Edge Function → Resend API → ✅ EMAILS ENVIADOS

La Edge Function ahora:
- Recibe el order_uuid
- Consulta la base de datos directamente para obtener todos los datos
- Construye los emails (cliente, admin, creadores)
- Envía los emails usando la API de Resend directamente
- No depende de triggers ni funciones SQL con http()
*/


