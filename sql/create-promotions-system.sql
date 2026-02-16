-- =============================================
-- SISTEMA DE PROMOCIONES
-- =============================================

-- OPCIÓN 1: Si la tabla ya existe, eliminarla y recrear
-- (Descomenta si quieres empezar de cero)
-- DROP TABLE IF EXISTS promotion_uses CASCADE;
-- DROP TABLE IF EXISTS promotions CASCADE;

-- OPCIÓN 2: Si prefieres agregar columna a tabla existente
-- (Ejecuta esto primero si ya tienes datos)
DO $$ 
BEGIN
  -- Verificar si la tabla promotions existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
    -- Agregar creator_id si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'promotions' AND column_name = 'creator_id'
    ) THEN
      ALTER TABLE promotions ADD COLUMN creator_id UUID;
    END IF;
  END IF;
END $$;

-- =============================================
-- CREAR TABLA PROMOTIONS (si no existe)
-- =============================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID,
  title_es TEXT NOT NULL,
  title_en TEXT,
  description_es TEXT,
  description_en TEXT,
  image_url TEXT,
  promotion_type TEXT NOT NULL DEFAULT 'discount' CHECK (promotion_type IN ('discount', 'free_item', 'bundle')),
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_fixed DECIMAL(10,2),
  free_item_product_id UUID,
  min_purchase_amount DECIMAL(10,2),
  min_purchase_items INTEGER,
  applicable_product_ids UUID[],
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  promo_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas faltantes si la tabla ya existía
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'creator_id') THEN
    ALTER TABLE promotions ADD COLUMN creator_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'title_es') THEN
    ALTER TABLE promotions ADD COLUMN title_es TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'title_en') THEN
    ALTER TABLE promotions ADD COLUMN title_en TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'description_es') THEN
    ALTER TABLE promotions ADD COLUMN description_es TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'description_en') THEN
    ALTER TABLE promotions ADD COLUMN description_en TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'promotion_type') THEN
    ALTER TABLE promotions ADD COLUMN promotion_type TEXT DEFAULT 'discount';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'discount_percentage') THEN
    ALTER TABLE promotions ADD COLUMN discount_percentage INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'discount_fixed') THEN
    ALTER TABLE promotions ADD COLUMN discount_fixed DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'is_active') THEN
    ALTER TABLE promotions ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'max_uses') THEN
    ALTER TABLE promotions ADD COLUMN max_uses INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'current_uses') THEN
    ALTER TABLE promotions ADD COLUMN current_uses INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'max_uses_per_user') THEN
    ALTER TABLE promotions ADD COLUMN max_uses_per_user INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'promo_code') THEN
    ALTER TABLE promotions ADD COLUMN promo_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'start_date') THEN
    ALTER TABLE promotions ADD COLUMN start_date TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'end_date') THEN
    ALTER TABLE promotions ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'created_at') THEN
    ALTER TABLE promotions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'updated_at') THEN
    ALTER TABLE promotions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_promotions_creator ON promotions(creator_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

-- RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Creators can manage own promotions" ON promotions;
DROP POLICY IF EXISTS "Admins can manage all promotions" ON promotions;

-- Todos pueden ver promociones activas
CREATE POLICY "Anyone can view active promotions" ON promotions
  FOR SELECT
  USING (is_active = true AND (end_date IS NULL OR end_date > NOW()));

-- Creadores pueden gestionar sus propias promociones
CREATE POLICY "Creators can manage own promotions" ON promotions
  FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Admins pueden gestionar todas las promociones
CREATE POLICY "Admins can manage all promotions" ON promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_promotions_updated_at ON promotions;
CREATE TRIGGER trigger_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();

-- =============================================
-- TABLA DE USO DE PROMOCIONES
-- =============================================

CREATE TABLE IF NOT EXISTS promotion_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  user_id UUID,
  order_id UUID,
  discount_applied DECIMAL(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_uses_promotion ON promotion_uses(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_uses_user ON promotion_uses(user_id);

ALTER TABLE promotion_uses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own promotion uses" ON promotion_uses;
DROP POLICY IF EXISTS "System can insert promotion uses" ON promotion_uses;
DROP POLICY IF EXISTS "Admins can view all promotion uses" ON promotion_uses;

CREATE POLICY "Users can view own promotion uses" ON promotion_uses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert promotion uses" ON promotion_uses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all promotion uses" ON promotion_uses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );

-- Función para incrementar usos
CREATE OR REPLACE FUNCTION increment_promotion_uses(promo_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promotions
  SET current_uses = current_uses + 1
  WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
