-- =====================================================
-- SISTEMA DE EMAILS DE BIENVENIDA - TASTY
-- Crear función y trigger para emails de bienvenida
-- =====================================================

-- 1. FUNCIÓN: Enviar email de bienvenida
CREATE OR REPLACE FUNCTION send_welcome_email(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  email_subject TEXT;
  email_body TEXT;
BEGIN
  -- Obtener datos del usuario
  SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at,
    CASE WHEN u.role = 'creator' THEN true ELSE false END as is_creator
  INTO user_record
  FROM users u
  WHERE u.id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_uuid;
  END IF;

  -- Email para creadores
  IF user_record.is_creator THEN
    email_subject := '🎉 ¡Bienvenido a TASTY como Creador!';
    email_body := '¡Hola ' || user_record.name || '!

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
    email_subject := '🍰 ¡Bienvenido a TASTY!';
    email_body := '¡Hola ' || user_record.name || '!

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

  -- Enviar email usando la función desplegada
  PERFORM net.http_post(
    url := 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', user_record.email,
      'subject', email_subject,
      'html', replace(email_body, E'\n', '<br>')
    )
  );

  -- Log del email enviado
  INSERT INTO email_logs (
    user_id,
    email_type,
    recipient_email,
    subject,
    sent_at,
    status
  ) VALUES (
    user_record.id,
    'welcome',
    user_record.email,
    email_subject,
    NOW(),
    'sent'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log del error
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
      'welcome',
      user_record.email,
      email_subject,
      NOW(),
      'failed',
      SQLERRM
    );
    
    RAISE NOTICE 'Error enviando email de bienvenida: %', SQLERRM;
END;
$$;

-- 2. CREAR TABLA DE LOGS DE EMAILS (si no existe)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'welcome', 'order_confirmation', 'order_status'
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla de logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(email_status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- 3. TRIGGER: Enviar email de bienvenida automáticamente
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo enviar email si es un nuevo usuario (no actualización)
  IF TG_OP = 'INSERT' THEN
    -- Enviar email de bienvenida de forma asíncrona
    PERFORM send_welcome_email(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger (eliminar si existe)
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON users;

CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();

-- 4. FUNCIÓN: Reenviar email de bienvenida manualmente
CREATE OR REPLACE FUNCTION resend_welcome_email(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  result_message TEXT;
BEGIN
  -- Buscar usuario por email
  SELECT id INTO user_uuid
  FROM users
  WHERE email = user_email;

  IF NOT FOUND THEN
    RETURN 'Usuario no encontrado con email: ' || user_email;
  END IF;

  -- Enviar email
  PERFORM send_welcome_email(user_uuid);
  
  RETURN 'Email de bienvenida reenviado exitosamente a: ' || user_email;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error reenviando email: ' || SQLERRM;
END;
$$;

-- 5. FUNCIÓN: Ver estadísticas de emails
CREATE OR REPLACE FUNCTION get_email_stats()
RETURNS TABLE (
  email_type VARCHAR(50),
  total_sent BIGINT,
  total_failed BIGINT,
  success_rate NUMERIC(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.email_type,
    COUNT(*) FILTER (WHERE el.status = 'sent') as total_sent,
    COUNT(*) FILTER (WHERE el.status = 'failed') as total_failed,
    ROUND(
      (COUNT(*) FILTER (WHERE el.status = 'sent')::NUMERIC / 
       NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
      2
    ) as success_rate
  FROM email_logs el
  GROUP BY el.email_type
  ORDER BY el.email_type;
END;
$$;

-- =====================================================
-- COMENTARIOS Y USO:
-- =====================================================

/*
FUNCIONALIDADES CREADAS:

1. AUTOMÁTICO:
   - Trigger que envía email de bienvenida al registrarse
   - Diferentes emails para creadores vs usuarios normales
   - Logs automáticos de todos los emails

2. MANUAL:
   - Reenviar email: SELECT resend_welcome_email('usuario@email.com');
   - Ver estadísticas: SELECT * FROM get_email_stats();

3. CONTENIDO DE EMAILS:
   - Creadores: Guía completa, panel de creador, beneficios
   - Usuarios: Bienvenida, ofertas, exploración de productos

4. LOGS Y MONITOREO:
   - Tabla email_logs con todos los envíos
   - Estados: pending, sent, failed
   - Mensajes de error para debugging

PRÓXIMOS PASOS:
1. Ejecutar este SQL en Supabase
2. Configurar RESEND_API_KEY
3. Probar con nuevo registro
4. Verificar logs: SELECT * FROM email_logs;
*/




