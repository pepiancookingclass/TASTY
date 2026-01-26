-- REVISAR ESTADO ACTUAL DE POLÍTICAS Y DATOS

-- 1. Ver políticas actuales de users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. Ver si RLS está habilitado en users
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'users';

-- 3. Ver todos los usuarios con rol creator
SELECT id, email, name, roles, created_at, profile_picture_url
FROM users 
WHERE roles::text LIKE '%creator%'
ORDER BY created_at;

-- 4. Verificar datos específicos de Maria Herman
SELECT id, email, name, roles, created_at, profile_picture_url, skills, workspace_photos
FROM users 
WHERE email = 'mariacoralia.herman@tasty.com';

-- 5. Ver productos de Maria Herman
SELECT id, title, creator_id, created_at
FROM products 
WHERE creator_id = '3abbc537-125b-4bc9-b5e0-0ea318f739d8';





