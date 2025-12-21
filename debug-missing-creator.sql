-- Verificar políticas actuales de usuarios
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Verificar si RLS está habilitado
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'users';

-- Verificar datos específicos del usuario Maria Herman
SELECT id, email, name, roles, created_at, profile_picture_url
FROM users 
WHERE email = 'mariacoralia.herman@tasty.com';

-- Verificar todos los usuarios con rol creator
SELECT id, email, name, roles, created_at, profile_picture_url
FROM users 
WHERE roles::text LIKE '%creator%';

-- Verificar productos de Maria Herman
SELECT id, title, creator_id, created_at
FROM products 
WHERE creator_id = '3abbc537-125b-4bc9-b5e0-0ea318f739d8';
