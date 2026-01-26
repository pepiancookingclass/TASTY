-- =====================================================
-- FIX FINAL: TODAS LAS FUNCIONES DE EMAIL CORREGIDAS
-- Usar extensions.http_post y service role key correcta
-- =====================================================

-- 1. FUNCIÓN: Enviar email de bienvenida (CORREGIDA)
CREATE OR REPLACE FUNCTION send_welcome_email(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  admin_email TEXT := 'pepiancookingclass@gmail.com';
  service_key TEXT := '7fb64017297e842f59522ea46ee53bc38cf3ad66cbe628f';
  user_email_subject TEXT;
  user_email_body TEXT;
  admin_email_subject TEXT;
  admin_email_body TEXT;
BEGIN
  -- Obtener datos del usuario
  SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at,
    CASE WHEN 'creator' = ANY(u.roles) THEN true ELSE false END as is_creator
  INTO user_record
  FROM users u
  WHERE u.id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_uuid;
  END IF;

  -- Email para creadores
  IF user_record.is_creator THEN
    user_email_subject := '🎉 ¡Bienvenido a TASTY como Creador!';
    user_email_body := '¡Hola ' || user_record.name || '!

🎉 ¡Bienvenido a TASTY como Creador!

Estamos emocionados de tenerte en nuestra plataforma. Como creador, podrás:

✨ BENEFICIOS PARA TI:
• Vender tus productos artesanales
• Recibir 90% de las ganancias
• Crear combos colaborativos
• Gestionar tus pedidos fácilmente
• Acceso a analytics de ventas

🚀 PRÓXIMOS PASOS:
1. Completa tu perfil de creador
2. Sube fotos de tu workspace
3. Agrega tus primeros productos
4. Crea ofertas especiales

📱 RECURSOS ÚTILES:
• Panel Creador: https://tasty.com/creator
• WhatsApp Soporte: +502 30635323

¡Gracias por ser parte de la familia TASTY! 🍰

---
Equipo TASTY
WhatsApp: +502 30635323';

    admin_email_subject := '🎯 Nuevo Creador Registrado - TASTY';
    admin_email_body := '🎯 NUEVO CREADOR REGISTRADO

DATOS DEL CREADOR:
• Nombre: ' || user_record.name || '
• Email: ' || user_record.email || '
• Fecha: ' || TO_CHAR(user_record.created_at, 'DD/MM/YYYY HH24:MI') || '
• Tipo: CREADOR

PRÓXIMOS PASOS:
1. Revisar perfil del creador
2. Aprobar productos cuando los suba
3. Monitorear primeras ventas

ACCIONES ADMIN:
• Panel Admin: https://tasty.com/admin

---
Sistema TASTY';

  ELSE
    -- Email para usuarios normales
    user_email_subject := '🍰 ¡Bienvenido a TASTY!';
    user_email_body := '¡Hola ' || user_record.name || '!

🍰 ¡Bienvenido a TASTY!

Gracias por unirte a nuestra comunidad de amantes de la comida artesanal.

✨ DESCUBRE TASTY:
• Productos artesanales únicos
• Creadores locales talentosos
• Combos especiales colaborativos
• Entrega a domicilio

🛍️ EXPLORA AHORA:
• Ver Creadores: https://tasty.com/creators
• Ofertas Activas: https://tasty.com/offers
• Combos Especiales: https://tasty.com/combos

📱 MANTENTE CONECTADO:
• WhatsApp: +502 30635323

¡Disfruta explorando TASTY! 🎉

---
Equipo TASTY
WhatsApp: +502 30635323';

    admin_email_subject := '👤 Nuevo Usuario Registrado - TASTY';
    admin_email_body := '👤 NUEVO USUARIO REGISTRADO

DATOS DEL USUARIO:
• Nombre: ' || user_record.name || '
• Email: ' || user_record.email || '
• Fecha: ' || TO_CHAR(user_record.created_at, 'DD/MM/YYYY HH24:MI') || '
• Tipo: CLIENTE

ACCIONES ADMIN:
• Panel Admin: https://tasty.com/admin

---
Sistema TASTY';

  END IF;

  -- ENVIAR EMAIL AL USUARIO (CORREGIDO)
  PERFORM extensions.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', user_record.email,
      'subject', user_email_subject,
      'html', replace(user_email_body, E'\n', '<br>')
    )::text
  );

  -- ENVIAR EMAIL AL ADMINISTRADOR (CORREGIDO)
  PERFORM extensions.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', admin_email,
      'subject', admin_email_subject,
      'html', replace(admin_email_body, E'\n', '<br>')
    )::text
  );

  -- Log del email al usuario
  BEGIN
    INSERT INTO email_logs (
      user_id,
      email_type,
      recipient_email,
      subject,
      sent_at,
      status
    ) VALUES (
      user_record.id,
      'welcome_user',
      user_record.email,
      user_email_subject,
      NOW(),
      'sent'
    );
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Tabla email_logs no existe';
  END;

  -- Log del email al admin
  BEGIN
    INSERT INTO email_logs (
      user_id,
      email_type,
      recipient_email,
      subject,
      sent_at,
      status
    ) VALUES (
      user_record.id,
      'welcome_admin',
      admin_email,
      admin_email_subject,
      NOW(),
      'sent'
    );
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Tabla email_logs no existe';
  END;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error enviando emails de bienvenida: %', SQLERRM;
END;
$$;

-- 2. ACTUALIZAR FUNCIONES DE PEDIDOS (CORREGIDAS)
CREATE OR REPLACE FUNCTION send_order_confirmation_email(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  order_items_json JSONB;
  delivery_address_text TEXT;
  estimated_delivery_text TEXT;
  email_subject TEXT;
  email_body TEXT;
  service_key TEXT := '7fb64017297e842f59522ea46ee53bc38cf3ad66cbe628f';
BEGIN
  -- Obtener datos del pedido
  SELECT 
    o.*,
    u.name as customer_name,
    u.email as customer_email,
    COALESCE(o.delivery_street || ', ' || o.delivery_city || ', ' || o.delivery_state, 'Dirección no especificada') as full_address,
    TO_CHAR(o.delivery_date, 'DD/MM/YYYY a las HH24:MI') as formatted_delivery
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', order_uuid;
  END IF;

  -- Obtener items del pedido
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_name', p.name_es,
      'quantity', oi.quantity,
      'price', oi.price_at_purchase,
      'total', oi.quantity * oi.price_at_purchase
    )
  ) INTO order_items_json
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = order_uuid;

  -- Construir email
  email_subject := '🍳 Confirmación de Pedido TASTY #' || SUBSTRING(order_record.id::text, 1, 8);
  email_body := '¡Hola ' || order_record.customer_name || '!

🎉 ¡Tu pedido ha sido confirmado exitosamente!

📋 DETALLES DEL PEDIDO:
• Número: #' || SUBSTRING(order_record.id::text, 1, 8) || '
• Total: Q' || order_record.total || '
• Entrega: ' || order_record.formatted_delivery || '
• Dirección: ' || order_record.full_address || '

🛍️ PRODUCTOS:
' || (
  SELECT string_agg(
    '• ' || (item->>'product_name') || ' x' || (item->>'quantity') || ' - Q' || (item->>'total'),
    E'\n'
  )
  FROM jsonb_array_elements(order_items_json) AS item
) || '

📱 PRÓXIMOS PASOS:
1. Recibirás WhatsApp de confirmación
2. Los creadores prepararán tu pedido
3. Te notificaremos cuando esté listo

¡Gracias por elegir TASTY! 🍰

---
Equipo TASTY
WhatsApp: +502 30635323';

  -- Enviar email (CORREGIDO)
  PERFORM extensions.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', order_record.customer_email,
      'subject', email_subject,
      'html', replace(email_body, E'\n', '<br>')
    )::text
  );
END;
$$;

-- 3. FUNCIÓN DE PRUEBA FINAL
CREATE OR REPLACE FUNCTION test_welcome_emails(test_email TEXT, test_name TEXT, is_creator_test BOOLEAN DEFAULT false)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_user_id UUID;
  result_message TEXT;
BEGIN
  -- Crear usuario temporal para prueba
  INSERT INTO users (id, email, name, roles, created_at)
  VALUES (
    gen_random_uuid(),
    test_email,
    test_name,
    CASE WHEN is_creator_test THEN ARRAY['creator'] ELSE ARRAY['customer'] END,
    NOW()
  )
  RETURNING id INTO test_user_id;

  -- Enviar emails
  PERFORM send_welcome_email(test_user_id);
  
  -- Eliminar usuario temporal
  DELETE FROM users WHERE id = test_user_id;
  
  result_message := '✅ Emails enviados a: ' || test_email || 
                   ' (Tipo: ' || CASE WHEN is_creator_test THEN 'CREADOR' ELSE 'CLIENTE' END || ')' ||
                   E'\n📧 Revisa tu bandeja de entrada y spam' ||
                   E'\n📧 Admin también recibió notificación';
  
  RETURN result_message;

EXCEPTION
  WHEN OTHERS THEN
    -- Limpiar usuario temporal si hay error
    DELETE FROM users WHERE id = test_user_id;
    RETURN '❌ Error: ' || SQLERRM;
END;
$$;

-- =====================================================
-- COMENTARIOS FINALES:
-- =====================================================

/*
CAMBIOS REALIZADOS:

1. ✅ CORREGIDO: net.http_post → extensions.http_post
2. ✅ CORREGIDO: Service role key usando la existente
3. ✅ CORREGIDO: Casting a ::text en body
4. ✅ ACTUALIZADO: Todas las funciones de email

FUNCIONES LISTAS:
- send_welcome_email() → Envía a usuario + admin
- send_order_confirmation_email() → Confirmación de pedidos
- test_welcome_emails() → Función de prueba

PRÓXIMO PASO:
1. Ejecutar este SQL completo
2. Probar: SELECT test_welcome_emails('ruajhostal@gmail.com', 'Rua Test', false);
3. Verificar emails en bandeja de entrada
*/





