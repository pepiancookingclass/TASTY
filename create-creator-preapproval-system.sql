-- =====================================================
-- SISTEMA DE PRE-APROBACIÓN DE CREADORES - TASTY
-- Agregar campo creator_status y emails correspondientes
-- =====================================================

-- 1. AGREGAR CAMPO creator_status A LA TABLA users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS creator_status TEXT CHECK (creator_status IN ('pending', 'active', 'rejected'));

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_users_creator_status ON users(creator_status);

-- =====================================================
-- 2. FUNCIÓN: Enviar emails de solicitud pendiente
-- =====================================================
CREATE OR REPLACE FUNCTION send_creator_application_emails(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  admin_email TEXT := 'pepiancookingclass@gmail.com';
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
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
    u.phone,
    u.instagram,
    u.skills,
    u.created_at
  INTO user_record
  FROM users u
  WHERE u.id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_uuid;
  END IF;

  -- =====================================================
  -- EMAIL PARA EL USUARIO (SOLICITUD RECIBIDA)
  -- =====================================================
  user_email_subject := '📋 Solicitud de Creador Recibida - TASTY';
  user_email_body := '¡Hola ' || user_record.name || '!

📋 ¡Tu solicitud para ser Creador ha sido recibida!

Gracias por tu interés en unirte a la familia TASTY como creador. Hemos recibido tu solicitud y está siendo revisada por nuestro equipo.

✨ LO QUE SIGUE:
• Revisaremos tu perfil y productos
• Evaluaremos tu propuesta y motivación
• Te contactaremos en 24-48 horas máximo

📋 TU SOLICITUD INCLUYE:
• Instagram: ' || COALESCE(user_record.instagram, 'No proporcionado') || '
• Especialidades: ' || COALESCE(array_to_string(user_record.skills, ', '), 'No especificadas') || '
• Teléfono: ' || COALESCE(user_record.phone, 'No proporcionado') || '

🎯 MIENTRAS ESPERAS:
• Prepara fotos de alta calidad de tus productos
• Piensa en descripciones atractivas
• Revisa otros creadores en la plataforma

📱 ¿PREGUNTAS?
Si tienes alguna duda, contáctanos:
• WhatsApp: +502 30635323
• Email: soporte@tasty.gt

¡Estamos emocionados de conocer tu propuesta! 🍰

---
Equipo TASTY
WhatsApp: +502 30635323
Email: soporte@tasty.gt';

  -- =====================================================
  -- EMAIL PARA EL ADMIN (NUEVA SOLICITUD)
  -- =====================================================
  admin_email_subject := '🔔 Nueva Solicitud de Creador - TASTY';
  admin_email_body := '🔔 NUEVA SOLICITUD DE CREADOR

DATOS DEL SOLICITANTE:
• Nombre: ' || user_record.name || '
• Email: ' || user_record.email || '
• Teléfono: ' || COALESCE(user_record.phone, 'No proporcionado') || '
• Instagram: ' || COALESCE(user_record.instagram, 'No proporcionado') || '
• Fecha de solicitud: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '

ESPECIALIDADES:
' || COALESCE(array_to_string(user_record.skills, ', '), 'No especificadas') || '

ACCIONES REQUERIDAS:
1. Revisar perfil completo del solicitante
2. Evaluar fotos de workspace (si las subió)
3. Verificar Instagram y calidad de productos
4. APROBAR o RECHAZAR la solicitud

ENLACES ÚTILES:
• Ver Perfil: https://tasty.com/admin/creators/pending
• Panel Admin: https://tasty.com/admin
• Gestionar Solicitudes: https://tasty.com/admin/creators

⏰ TIEMPO DE RESPUESTA: 24-48 horas máximo

---
Sistema TASTY
Notificación automática';

  -- Enviar email al usuario
  PERFORM extensions.http_post(
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    jsonb_build_object(
      'to', user_record.email,
      'subject', user_email_subject,
      'text', user_email_body
    ),
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );

  -- Enviar email al admin
  PERFORM extensions.http_post(
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    jsonb_build_object(
      'to', admin_email,
      'subject', admin_email_subject,
      'text', admin_email_body
    ),
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );

END;
$$;

-- =====================================================
-- 3. FUNCIÓN: Enviar emails de aprobación
-- =====================================================
CREATE OR REPLACE FUNCTION send_creator_approval_emails(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  admin_email TEXT := 'pepiancookingclass@gmail.com';
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
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
    u.created_at
  INTO user_record
  FROM users u
  WHERE u.id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_uuid;
  END IF;

  -- =====================================================
  -- EMAIL PARA EL USUARIO (APROBADO - USAR EMAIL ACTUAL)
  -- =====================================================
  -- Usar la función de bienvenida existente que ya está perfecta
  PERFORM send_welcome_email(user_uuid);

  -- =====================================================
  -- EMAIL PARA EL ADMIN (CONFIRMACIÓN DE APROBACIÓN)
  -- =====================================================
  admin_email_subject := '✅ Creador Aprobado y Activado - TASTY';
  admin_email_body := '✅ CREADOR APROBADO Y ACTIVADO

DATOS DEL NUEVO CREADOR:
• Nombre: ' || user_record.name || '
• Email: ' || user_record.email || '
• Fecha de aprobación: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '
• Estado: ACTIVO

ACCIONES COMPLETADAS:
✅ Rol de creador asignado
✅ Email de bienvenida enviado al creador
✅ Acceso al panel de creador habilitado
✅ Permisos de creación de productos activados

PRÓXIMOS PASOS:
• Monitorear primeros productos que suba
• Revisar calidad de fotos y descripciones
• Apoyar en primeras ventas si es necesario

ENLACES ÚTILES:
• Ver Perfil: https://tasty.com/admin/creators
• Panel Admin: https://tasty.com/admin
• Analytics: https://tasty.com/admin/analytics

---
Sistema TASTY
Notificación automática';

  -- Enviar email al admin
  PERFORM extensions.http_post(
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    jsonb_build_object(
      'to', admin_email,
      'subject', admin_email_subject,
      'text', admin_email_body
    ),
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );

END;
$$;

-- =====================================================
-- 4. FUNCIÓN: Enviar emails de rechazo
-- =====================================================
CREATE OR REPLACE FUNCTION send_creator_rejection_emails(user_uuid UUID, rejection_reason TEXT DEFAULT 'No especificada')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  admin_email TEXT := 'pepiancookingclass@gmail.com';
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4';
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
    u.created_at
  INTO user_record
  FROM users u
  WHERE u.id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_uuid;
  END IF;

  -- =====================================================
  -- EMAIL PARA EL USUARIO (RECHAZO)
  -- =====================================================
  user_email_subject := '📝 Actualización sobre tu Solicitud de Creador - TASTY';
  user_email_body := '¡Hola ' || user_record.name || '!

📝 Actualización sobre tu solicitud de creador

Gracias por tu interés en unirte a TASTY como creador. Después de revisar tu solicitud, hemos decidido no aprobarla en este momento.

🔍 RAZÓN DE LA DECISIÓN:
' || rejection_reason || '

💡 ¿QUÉ PUEDES HACER?
• Mejorar la calidad de las fotos de tus productos
• Completar más información en tu perfil
• Agregar más variedad a tu oferta
• Volver a aplicar en 30 días

🎯 CONSEJOS PARA FUTURAS APLICACIONES:
• Fotos profesionales y bien iluminadas
• Descripciones detalladas de productos
• Instagram activo con contenido de calidad
• Variedad en tipos de productos

📱 ¿PREGUNTAS O DUDAS?
Nuestro equipo está aquí para ayudarte:
• WhatsApp: +502 30635323
• Email: soporte@tasty.gt

¡No te desanimes! Muchos de nuestros mejores creadores aplicaron más de una vez. Esperamos verte de nuevo pronto. 🍰

---
Equipo TASTY
WhatsApp: +502 30635323
Email: soporte@tasty.gt';

  -- =====================================================
  -- EMAIL PARA EL ADMIN (REGISTRO DE RECHAZO)
  -- =====================================================
  admin_email_subject := '❌ Solicitud de Creador Rechazada - TASTY';
  admin_email_body := '❌ SOLICITUD DE CREADOR RECHAZADA

DATOS DEL SOLICITANTE:
• Nombre: ' || user_record.name || '
• Email: ' || user_record.email || '
• Fecha de rechazo: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || '
• Estado: RECHAZADO

RAZÓN DEL RECHAZO:
' || rejection_reason || '

ACCIONES COMPLETADAS:
✅ Email de rechazo enviado al solicitante
✅ Estado actualizado en la base de datos
✅ Registro guardado para seguimiento

ESTADÍSTICAS:
• Puede volver a aplicar en 30 días
• Historial de solicitud guardado
• Feedback proporcionado para mejora

RECORDATORIO:
• Mantener registro de rechazos para análisis
• Revisar patrones comunes de rechazo
• Mejorar criterios si es necesario

---
Sistema TASTY
Notificación automática';

  -- Enviar email al usuario
  PERFORM extensions.http_post(
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    jsonb_build_object(
      'to', user_record.email,
      'subject', user_email_subject,
      'text', user_email_body
    ),
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );

  -- Enviar email al admin
  PERFORM extensions.http_post(
    'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email',
    jsonb_build_object(
      'to', admin_email,
      'subject', admin_email_subject,
      'text', admin_email_body
    ),
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );

END;
$$;

-- =====================================================
-- 5. FUNCIÓN: Procesar solicitud de creador (NUEVA)
-- =====================================================
CREATE OR REPLACE FUNCTION process_creator_application(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar estado a pendiente
  UPDATE users 
  SET creator_status = 'pending'
  WHERE id = user_uuid;

  -- Enviar emails de solicitud
  PERFORM send_creator_application_emails(user_uuid);
END;
$$;

-- =====================================================
-- 6. FUNCIÓN: Aprobar creador
-- =====================================================
CREATE OR REPLACE FUNCTION approve_creator(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_roles TEXT[];
BEGIN
  -- Obtener roles actuales
  SELECT roles INTO current_roles FROM users WHERE id = user_uuid;
  
  -- Agregar rol creator si no lo tiene
  IF NOT ('creator' = ANY(current_roles)) THEN
    UPDATE users 
    SET 
      roles = array_append(current_roles, 'creator'),
      creator_status = 'active'
    WHERE id = user_uuid;
  ELSE
    -- Solo actualizar estado
    UPDATE users 
    SET creator_status = 'active'
    WHERE id = user_uuid;
  END IF;

  -- Enviar emails de aprobación
  PERFORM send_creator_approval_emails(user_uuid);
END;
$$;

-- =====================================================
-- 7. FUNCIÓN: Rechazar creador
-- =====================================================
CREATE OR REPLACE FUNCTION reject_creator(user_uuid UUID, rejection_reason TEXT DEFAULT 'No especificada')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar estado a rechazado
  UPDATE users 
  SET creator_status = 'rejected'
  WHERE id = user_uuid;

  -- Enviar emails de rechazo
  PERFORM send_creator_rejection_emails(user_uuid, rejection_reason);
END;
$$;

-- =====================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON COLUMN users.creator_status IS 'Estado de la solicitud de creador: pending, active, rejected';
COMMENT ON FUNCTION send_creator_application_emails(UUID) IS 'Envía emails cuando alguien solicita ser creador';
COMMENT ON FUNCTION send_creator_approval_emails(UUID) IS 'Envía emails cuando se aprueba un creador';
COMMENT ON FUNCTION send_creator_rejection_emails(UUID, TEXT) IS 'Envía emails cuando se rechaza un creador';
COMMENT ON FUNCTION process_creator_application(UUID) IS 'Procesa solicitud inicial de creador';
COMMENT ON FUNCTION approve_creator(UUID) IS 'Aprueba y activa un creador';
COMMENT ON FUNCTION reject_creator(UUID, TEXT) IS 'Rechaza una solicitud de creador';

-- =====================================================
-- 9. VERIFICACIÓN
-- =====================================================

-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'creator_status';

-- Verificar que las funciones se crearon
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%creator%' 
AND routine_schema = 'public';

-- =====================================================
-- LISTO PARA USAR
-- =====================================================

-- EJEMPLOS DE USO:
-- 1. Procesar solicitud: SELECT process_creator_application('user-uuid-here');
-- 2. Aprobar creador: SELECT approve_creator('user-uuid-here');
-- 3. Rechazar creador: SELECT reject_creator('user-uuid-here', 'Fotos de baja calidad');



