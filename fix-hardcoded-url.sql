-- Cambiar URL hardcodeada por variable de entorno
-- Reemplazar en TODAS las funciones:
-- 'https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email'
-- POR:
-- current_setting('app.supabase_url') || '/functions/v1/send-email'

-- O usar URL local si están en desarrollo:
-- 'http://localhost:54321/functions/v1/send-email'

