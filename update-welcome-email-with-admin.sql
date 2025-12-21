-- =====================================================
-- ACTUALIZAR: SISTEMA DE EMAILS DE BIENVENIDA + ADMIN
-- Enviar email al usuario Y al administrador
-- =====================================================

-- 1. FUNCIÓN ACTUALIZADA: Enviar email de bienvenida + notificación admin
CREATE OR REPLACE FUNCTION send_welcome_email(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  admin_email TEXT := 'pepiancookingclass@gmail.com'; -- Email del administrador
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

  -- =====================================================
  -- EMAIL PARA EL USUARIO (BIENVENIDA)
  -- =====================================================
  
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
• Guía de Inicio: https://tasty.com/creator/guide
• WhatsApp Soporte: +502 30635323

💰 OFERTAS ACTIVAS:
¡Aprovecha las ofertas especiales de otros creadores!
Ver Ofertas: https://tasty.com/offers

¡Gracias por ser parte de la familia TASTY! 🍰

---
Equipo TASTY
WhatsApp: +502 30635323
Email: soporte@tasty.gt';

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

🎁 OFERTAS ESPECIALES:
¡Aprovecha nuestras ofertas de bienvenida!

🛍️ EXPLORA AHORA:
• Ver Creadores: https://tasty.com/creators
• Ofertas Activas: https://tasty.com/offers
• Combos Especiales: https://tasty.com/combos

📱 MANTENTE CONECTADO:
• Mis Pedidos: https://tasty.com/user/orders
• Mi Perfil: https://tasty.com/user/profile
• WhatsApp: +502 30635323

💡 CONSEJO:
Completa tu perfil para una mejor experiencia de compra.

¡Disfruta explorando TASTY! 🎉

---
Equipo TASTY
WhatsApp: +502 30635323
Email: soporte@tasty.gt';

  END IF;

  -- =====================================================
  -- EMAIL PARA EL ADMINISTRADOR (NOTIFICACIÓN)
  -- =====================================================
  
  IF user_record.is_creator THEN
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
• Ver Perfil: https://tasty.com/admin/creators
• Panel Admin: https://tasty.com/admin
• Analytics: https://tasty.com/admin/analytics

---
Sistema TASTY
Notificación automática';

  ELSE
    admin_email_subject := '👤 Nuevo Usuario Registrado - TASTY';
    admin_email_body := '👤 NUEVO USUARIO REGISTRADO

DATOS DEL USUARIO:
• Nombre: ' || user_record.name || '
• Email: ' || user_record.email || '
• Fecha: ' || TO_CHAR(user_record.created_at, 'DD/MM/YYYY HH24:MI') || '
• Tipo: CLIENTE

ESTADÍSTICAS:
• Total Usuarios: (Ver en Analytics)
• Conversión: (Ver en Analytics)

ACCIONES ADMIN:
• Panel Admin: https://tasty.com/admin
• Analytics: https://tasty.com/admin/analytics
• Ver Usuarios: https://tasty.com/admin/users

---
Sistema TASTY
Notificación automática';

  END IF;

  -- =====================================================
  -- ENVIAR AMBOS EMAILS
  -- =====================================================

  -- 1. ENVIAR EMAIL AL USUARIO
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', user_record.email,
      'subject', user_email_subject,
      'html', replace(user_email_body, E'\n', '<br>')
    )
  );

  -- 2. ENVIAR EMAIL AL ADMINISTRADOR
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', admin_email,
      'subject', admin_email_subject,
      'html', replace(admin_email_body, E'\n', '<br>')
    )
  );

  -- =====================================================
  -- LOGS DE AMBOS EMAILS
  -- =====================================================

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
      RAISE NOTICE 'Tabla email_logs no existe, saltando log';
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
      RAISE NOTICE 'Tabla email_logs no existe, saltando log admin';
  END;

EXCEPTION
  WHEN OTHERS THEN
    -- Log del error
    BEGIN
      INSERT INTO email_logs (
        user_id,
        email_type,
        recipient_email,
        subject,
        sent_at,
        status,
        error_message
      ) VALUES (
        user_record.id,
        'welcome_error',
        user_record.email,
        user_email_subject,
        NOW(),
        'failed',
        SQLERRM
      );
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Tabla email_logs no existe, saltando log de error';
    END;
    
    RAISE NOTICE 'Error enviando emails de bienvenida: %', SQLERRM;
END;
$$;

-- =====================================================
-- FUNCIÓN PARA PROBAR MANUALMENTE
-- =====================================================

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
  
  result_message := 'Emails de prueba enviados exitosamente a: ' || test_email || 
                   ' (Tipo: ' || CASE WHEN is_creator_test THEN 'CREADOR' ELSE 'CLIENTE' END || ')';
  
  RETURN result_message;

EXCEPTION
  WHEN OTHERS THEN
    -- Limpiar usuario temporal si hay error
    DELETE FROM users WHERE id = test_user_id;
    RETURN 'Error enviando emails de prueba: ' || SQLERRM;
END;
$$;

-- =====================================================
-- COMENTARIOS Y USO:
-- =====================================================

/*
CAMBIOS REALIZADOS:

1. DOBLE EMAIL AUTOMÁTICO:
   - Email de bienvenida al usuario
   - Email de notificación al administrador

2. DIFERENTES CONTENIDOS:
   - Usuario: Bienvenida y guía de uso
   - Admin: Notificación con datos del nuevo usuario

3. LOGS SEPARADOS:
   - welcome_user: Email al usuario
   - welcome_admin: Email al administrador

4. FUNCIÓN DE PRUEBA:
   - test_welcome_emails('email@test.com', 'Nombre Test', true/false)

CONFIGURACIÓN:
1. CAMBIAR EMAIL ADMIN en línea 15: admin_email := 'tu@email.com';
2. Ejecutar este SQL
3. Probar: SELECT test_welcome_emails('test@email.com', 'Usuario Test', false);

FUNCIONARÁ IGUAL que el otro proyecto, pero con ambos emails automáticos.
*/
