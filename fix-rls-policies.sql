-- Script para verificar y arreglar RLS policies en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Eliminar políticas existentes si causan problemas
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- 3. Crear políticas más permisivas para debugging
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Verificar que RLS esté habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Verificar estructura de la tabla (comando para psql, no funciona en Supabase)
-- \d users;

-- En su lugar, usar este query para ver la estructura:
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
