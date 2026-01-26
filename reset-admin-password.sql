-- =====================================================
-- RESETEAR CONTRASEÑA DEL USUARIO ADMIN
-- ¡¡¡ EJECUTAR SOLO CON POSTGRES ROLE !!!
-- =====================================================

-- OPCIÓN 1: Resetear contraseña a "admin123" (temporal)
UPDATE auth.users 
SET 
  encrypted_password = crypt('admin123', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'pepiancookingclass@gmail.com';

-- OPCIÓN 2: Marcar email como confirmado (por si acaso)
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'pepiancookingclass@gmail.com' 
  AND email_confirmed_at IS NULL;

-- Verificar que se actualizó
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'pepiancookingclass@gmail.com';

-- =====================================================
-- DESPUÉS DE EJECUTAR:
-- 1. Probar login con: pepiancookingclass@gmail.com / admin123
-- 2. Cambiar contraseña desde la aplicación
-- =====================================================




