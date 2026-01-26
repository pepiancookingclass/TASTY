-- ✅ FASE 2: Tabla para backup de carritos de usuarios
-- Ejecutar en Supabase SQL Editor

CREATE TABLE user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cart_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un usuario solo puede tener un carrito
  UNIQUE(user_id)
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX idx_user_carts_user_id ON user_carts(user_id);

-- RLS (Row Level Security) para que usuarios solo vean su carrito
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- Política: Usuario solo puede ver/modificar su propio carrito
CREATE POLICY "Users can manage their own cart" ON user_carts
  FOR ALL USING (auth.uid() = user_id);

-- Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-actualizar updated_at
CREATE TRIGGER trigger_update_user_carts_updated_at
  BEFORE UPDATE ON user_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_carts_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE user_carts IS 'Backup de carritos de compras de usuarios logueados';
COMMENT ON COLUMN user_carts.cart_data IS 'Array de productos en formato JSON: [{"product": {...}, "quantity": 1}]';

