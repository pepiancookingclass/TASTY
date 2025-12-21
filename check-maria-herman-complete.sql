-- VERIFICAR ESTADO COMPLETO DE MARIA HERMAN

-- 1. Ver datos de Maria Herman
SELECT id, email, name, roles, created_at, profile_picture_url, skills, workspace_photos
FROM users 
WHERE email = 'mariacoralia.herman@tasty.com';

-- 2. Ver productos de Maria Herman (con nombres correctos)
SELECT id, name_es, name_en, type, price, creator_id, created_at
FROM products 
WHERE creator_id = '3abbc537-125b-4bc9-b5e0-0ea318f739d8';

-- 3. Verificar que las políticas permiten ver creadores
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND policyname LIKE '%creator%';
