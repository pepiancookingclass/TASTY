-- ARREGLAR VISIBILIDAD DE CREADORES
-- El problema: las políticas actuales solo permiten ver el propio perfil
-- Necesitamos: permitir que todos vean los perfiles de los creadores

-- Agregar política para que todos puedan ver perfiles de creadores
CREATE POLICY "Public can view creator profiles" ON users
    FOR SELECT USING (roles::text LIKE '%creator%');

-- Verificar las políticas después del cambio
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;




