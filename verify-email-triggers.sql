-- =====================================================
-- VERIFICAR QUE LOS TRIGGERS DE EMAIL ESTÉN ACTIVOS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Verificar que las funciones existen
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%email%' OR routine_name LIKE '%order%';

-- 2. Verificar que el trigger existe y está activo
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'send_emails_on_order_creation';

-- 3. Verificar que la función del trigger existe
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'trigger_order_emails';

-- 4. PROBAR EL SISTEMA (opcional - solo si quieres testear)
-- NOTA: Esto creará un pedido de prueba y enviará emails reales
-- Descomenta solo si quieres probar:

/*
-- Crear un pedido de prueba para verificar emails
INSERT INTO orders (
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    total,
    delivery_date,
    delivery_street,
    delivery_city,
    delivery_state,
    payment_method,
    status
) VALUES (
    (SELECT id FROM users WHERE email LIKE '%@%' LIMIT 1), -- Usar un usuario existente
    'Cliente de Prueba',
    'test@example.com', -- CAMBIAR POR EMAIL REAL PARA PROBAR
    '+502 1234-5678',
    100.00,
    NOW() + INTERVAL '2 hours',
    'Dirección de prueba 123',
    'Guatemala',
    'Guatemala',
    'cash',
    'new'
);
*/





