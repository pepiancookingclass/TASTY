-- Llamar la función de email DIRECTAMENTE desde la app después del INSERT
-- En src/lib/services/orders.ts después de crear la orden:

-- await supabase.rpc('send_order_confirmation_email', { order_uuid: orderData.id });

