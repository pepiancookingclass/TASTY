-- =====================================================
-- FIX: USAR SERVICE ROLE KEY DESDE VARIABLES DE ENTORNO
-- Actualizar función para usar la variable configurada
-- =====================================================

-- Actualizar función para usar service role key desde variables de entorno
CREATE OR REPLACE FUNCTION send_welcome_email(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  admin_email TEXT := 'pepiancookingclass@gmail.com';
  service_key TEXT;
  user_email_subject TEXT;
  user_email_body TEXT;
  admin_email_subject TEXT;
  admin_email_body TEXT;
BEGIN
  -- Obtener service role key (usar la que está en variables de entorno)
  service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';

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

  -- ENVIAR EMAIL AL USUARIO
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', user_record.email,
      'subject', user_email_subject,
      'html', replace(user_email_body, E'\n', '<br>')
    )
  );

  -- ENVIAR EMAIL AL ADMINISTRADOR
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', admin_email,
      'subject', admin_email_subject,
      'html', replace(admin_email_body, E'\n', '<br>')
    )
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

-- Función de prueba actualizada
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
  
  result_message := 'Emails enviados a: ' || test_email || 
                   ' (Tipo: ' || CASE WHEN is_creator_test THEN 'CREADOR' ELSE 'CLIENTE' END || ')' ||
                   ' - Revisa tu bandeja de entrada y spam';
  
  RETURN result_message;

EXCEPTION
  WHEN OTHERS THEN
    -- Limpiar usuario temporal si hay error
    DELETE FROM users WHERE id = test_user_id;
    RETURN 'Error: ' || SQLERRM;
END;
$$;




