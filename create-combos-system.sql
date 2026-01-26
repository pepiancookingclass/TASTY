-- =====================================================
-- SISTEMA DE COMBOS COLABORATIVOS PARA TASTY
-- Permite que varios creadores trabajen juntos en ofertas
-- =====================================================

-- 1. Tabla principal de combos
CREATE TABLE IF NOT EXISTS combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_es TEXT NOT NULL,
  name_en TEXT,
  description_es TEXT NOT NULL,
  description_en TEXT,
  image_url TEXT,
  category VARCHAR(50) NOT NULL, -- 'sweet_savory', 'full_meal', 'dessert_mix', etc.
  total_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL, -- Suma de precios individuales
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  available_from TIMESTAMP DEFAULT NOW(),
  available_until TIMESTAMP,
  max_orders INTEGER, -- Límite de pedidos (opcional)
  current_orders INTEGER DEFAULT 0,
  preparation_time INTEGER DEFAULT 120, -- En minutos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) -- Creador principal que organizó el combo
);

-- 2. Tabla de productos incluidos en cada combo
CREATE TABLE IF NOT EXISTS combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID REFERENCES combos(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id), -- Para facilitar consultas
  quantity INTEGER DEFAULT 1,
  individual_price DECIMAL(10,2) NOT NULL, -- Precio del producto al momento de crear el combo
  creator_percentage DECIMAL(5,2) DEFAULT 90.00, -- Porcentaje que recibe este creador (default 90%)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(combo_id, product_id)
);

-- 3. Tabla de creadores participantes (para facilitar consultas)
CREATE TABLE IF NOT EXISTS combo_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID REFERENCES combos(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_avatar TEXT,
  products_count INTEGER DEFAULT 1,
  total_contribution DECIMAL(10,2) NOT NULL, -- Valor total que aporta este creador
  revenue_percentage DECIMAL(5,2) NOT NULL, -- Porcentaje de las ganancias que recibe
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(combo_id, creator_id)
);

-- 4. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_combos_category ON combos(category);
CREATE INDEX IF NOT EXISTS idx_combos_active ON combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combos_featured ON combos(is_featured);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_creator ON combo_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_combo_creators_combo ON combo_creators(combo_id);

-- 5. Función para calcular automáticamente los porcentajes de ganancia
CREATE OR REPLACE FUNCTION calculate_combo_revenue_split(combo_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_contribution DECIMAL(10,2);
  creator_record RECORD;
BEGIN
  -- Obtener el total de contribuciones
  SELECT SUM(ci.individual_price * ci.quantity) INTO total_contribution
  FROM combo_items ci
  WHERE ci.combo_id = combo_uuid;
  
  -- Actualizar porcentajes para cada creador
  FOR creator_record IN 
    SELECT 
      cc.creator_id,
      SUM(ci.individual_price * ci.quantity) as creator_contribution
    FROM combo_creators cc
    JOIN combo_items ci ON cc.combo_id = ci.combo_id AND cc.creator_id = ci.creator_id
    WHERE cc.combo_id = combo_uuid
    GROUP BY cc.creator_id
  LOOP
    UPDATE combo_creators 
    SET 
      total_contribution = creator_record.creator_contribution,
      revenue_percentage = (creator_record.creator_contribution / total_contribution * 100)
    WHERE combo_id = combo_uuid AND creator_id = creator_record.creator_id;
  END LOOP;
END;
$$;

-- 6. Función para obtener combos activos con detalles
CREATE OR REPLACE FUNCTION get_active_combos(
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name_es TEXT,
  name_en TEXT,
  description_es TEXT,
  description_en TEXT,
  image_url TEXT,
  category VARCHAR(50),
  total_price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  discount_percentage INTEGER,
  is_featured BOOLEAN,
  preparation_time INTEGER,
  creators_count BIGINT,
  products_count BIGINT,
  available_until TIMESTAMP,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name_es,
    c.name_en,
    c.description_es,
    c.description_en,
    c.image_url,
    c.category,
    c.total_price,
    c.original_price,
    c.discount_percentage,
    c.is_featured,
    c.preparation_time,
    COUNT(DISTINCT cc.creator_id) as creators_count,
    COUNT(DISTINCT ci.product_id) as products_count,
    c.available_until,
    c.created_at
  FROM combos c
  LEFT JOIN combo_creators cc ON c.id = cc.combo_id
  LEFT JOIN combo_items ci ON c.id = ci.combo_id
  WHERE 
    c.is_active = true
    AND (c.available_until IS NULL OR c.available_until > NOW())
    AND (category_filter IS NULL OR c.category = category_filter)
    AND (c.max_orders IS NULL OR c.current_orders < c.max_orders)
  GROUP BY c.id, c.name_es, c.name_en, c.description_es, c.description_en, 
           c.image_url, c.category, c.total_price, c.original_price, 
           c.discount_percentage, c.is_featured, c.preparation_time, 
           c.available_until, c.created_at
  ORDER BY c.is_featured DESC, c.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;

-- 7. Función para obtener detalles completos de un combo
CREATE OR REPLACE FUNCTION get_combo_details(combo_uuid UUID)
RETURNS TABLE (
  combo_id UUID,
  combo_name_es TEXT,
  combo_description_es TEXT,
  combo_image TEXT,
  combo_category VARCHAR(50),
  combo_total_price DECIMAL(10,2),
  combo_original_price DECIMAL(10,2),
  combo_discount INTEGER,
  product_id UUID,
  product_name_es TEXT,
  product_image TEXT,
  product_quantity INTEGER,
  product_price DECIMAL(10,2),
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as combo_id,
    c.name_es as combo_name_es,
    c.description_es as combo_description_es,
    c.image_url as combo_image,
    c.category as combo_category,
    c.total_price as combo_total_price,
    c.original_price as combo_original_price,
    c.discount_percentage as combo_discount,
    p.id as product_id,
    p.name_es as product_name_es,
    p.image_url as product_image,
    ci.quantity as product_quantity,
    ci.individual_price as product_price,
    u.id as creator_id,
    u.name as creator_name,
    u.profile_picture_url as creator_avatar
  FROM combos c
  JOIN combo_items ci ON c.id = ci.combo_id
  JOIN products p ON ci.product_id = p.id
  JOIN users u ON ci.creator_id = u.id
  WHERE c.id = combo_uuid AND c.is_active = true;
END;
$$;

-- 8. Trigger para actualizar combo_creators cuando se modifica combo_items
CREATE OR REPLACE FUNCTION update_combo_creators()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Eliminar registros existentes para este combo
  DELETE FROM combo_creators WHERE combo_id = NEW.combo_id;
  
  -- Insertar registros actualizados
  INSERT INTO combo_creators (combo_id, creator_id, creator_name, creator_avatar, products_count, total_contribution, revenue_percentage)
  SELECT 
    NEW.combo_id,
    ci.creator_id,
    u.name,
    u.profile_picture_url,
    COUNT(ci.product_id),
    SUM(ci.individual_price * ci.quantity),
    0 -- Se calculará después
  FROM combo_items ci
  JOIN users u ON ci.creator_id = u.id
  WHERE ci.combo_id = NEW.combo_id
  GROUP BY ci.creator_id, u.name, u.profile_picture_url;
  
  -- Calcular porcentajes
  PERFORM calculate_combo_revenue_split(NEW.combo_id);
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER combo_items_update_creators
  AFTER INSERT OR UPDATE OR DELETE ON combo_items
  FOR EACH ROW
  EXECUTE FUNCTION update_combo_creators();

-- 9. Políticas RLS
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_creators ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver combos activos
CREATE POLICY "Anyone can view active combos" ON combos
  FOR SELECT USING (is_active = true);

-- Solo creadores pueden crear combos
CREATE POLICY "Creators can create combos" ON combos
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE roles::text LIKE '%creator%')
  );

-- Solo el creador principal o admin puede modificar
CREATE POLICY "Creators can update own combos" ON combos
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() IN (SELECT id FROM users WHERE roles::text LIKE '%admin%')
  );

-- Políticas para combo_items
CREATE POLICY "Anyone can view combo items" ON combo_items FOR SELECT USING (true);
CREATE POLICY "Creators can manage combo items" ON combo_items 
  FOR ALL USING (
    auth.uid() = creator_id OR
    auth.uid() IN (SELECT created_by FROM combos WHERE id = combo_id) OR
    auth.uid() IN (SELECT id FROM users WHERE roles::text LIKE '%admin%')
  );

-- Políticas para combo_creators
CREATE POLICY "Anyone can view combo creators" ON combo_creators FOR SELECT USING (true);
CREATE POLICY "System can manage combo creators" ON combo_creators FOR ALL USING (true);

-- 10. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_active_combos(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_combo_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_combo_revenue_split(UUID) TO authenticated;

-- 11. Datos de ejemplo
INSERT INTO combos (name_es, description_es, category, total_price, original_price, discount_percentage, is_featured, created_by) VALUES
('Combo Dulce & Salado', 'La perfecta combinación: brownies de chocolate de María y empanadas caseras de Ana. ¡Lo mejor de ambos mundos!', 'sweet_savory', 85.00, 95.00, 11, true, (SELECT id FROM users WHERE roles::text LIKE '%creator%' LIMIT 1)),
('Desayuno Completo', 'Comienza tu día perfecto: pan tostado artesanal, mermelada casera y café de especialidad.', 'breakfast', 45.00, 50.00, 10, false, (SELECT id FROM users WHERE roles::text LIKE '%creator%' LIMIT 1)),
('Fiesta Dulce', 'Para celebrar en grande: cupcakes, galletas decoradas y mini cheesecakes de diferentes creadores.', 'dessert_mix', 120.00, 140.00, 14, true, (SELECT id FROM users WHERE roles::text LIKE '%creator%' LIMIT 1));

COMMENT ON TABLE combos IS 'Combos colaborativos entre múltiples creadores';
COMMENT ON TABLE combo_items IS 'Productos incluidos en cada combo';
COMMENT ON TABLE combo_creators IS 'Creadores participantes en cada combo con su distribución de ganancias';





