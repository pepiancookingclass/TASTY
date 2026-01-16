-- PASO 1: Habilitar RLS en la tabla products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- PASO 2: Crear políticas para productos
-- Los creadores pueden ver todos los productos (para el marketplace)
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

-- Los creadores pueden crear sus propios productos
CREATE POLICY "Creators can create own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Los creadores pueden actualizar solo sus propios productos
CREATE POLICY "Creators can update own products" ON products
    FOR UPDATE USING (auth.uid() = creator_id);

-- Los creadores pueden eliminar solo sus propios productos
CREATE POLICY "Creators can delete own products" ON products
    FOR DELETE USING (auth.uid() = creator_id);




