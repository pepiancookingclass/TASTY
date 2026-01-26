-- 🔧 CREAR FUNCIONES FALTANTES PARA COMBOS
-- Ejecutar en Supabase SQL Editor

-- 1. Función para obtener combos activos
CREATE OR REPLACE FUNCTION get_active_combos()
RETURNS TABLE (
  id UUID,
  name JSONB,
  description JSONB,
  image_url TEXT,
  image_hint TEXT,
  price DECIMAL(8,2),
  discount_percentage INTEGER,
  type TEXT,
  is_available BOOLEAN,
  available_quantity INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  creator_id UUID,
  creator_name TEXT,
  creator_profile_picture_url TEXT,
  total_items INTEGER,
  preparation_time INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.image_url,
    c.image_hint,
    c.price,
    c.discount_percentage,
    c.type,
    c.is_available,
    c.available_quantity,
    c.expires_at,
    c.created_at,
    c.updated_at,
    c.creator_id,
    u.name as creator_name,
    u.profile_picture_url as creator_profile_picture_url,
    (SELECT COUNT(*) FROM combo_items ci WHERE ci.combo_id = c.id)::INTEGER as total_items,
    c.preparation_time
  FROM combos c
  JOIN users u ON c.creator_id = u.id
  WHERE c.is_available = true
    AND (c.expires_at IS NULL OR c.expires_at > NOW())
    AND (c.available_quantity IS NULL OR c.available_quantity > 0)
  ORDER BY c.created_at DESC;
END;
$$;

-- 2. Función para obtener detalles de un combo específico
CREATE OR REPLACE FUNCTION get_combo_details(combo_id UUID)
RETURNS TABLE (
  id UUID,
  name JSONB,
  description JSONB,
  image_url TEXT,
  image_hint TEXT,
  price DECIMAL(8,2),
  discount_percentage INTEGER,
  type TEXT,
  is_available BOOLEAN,
  available_quantity INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  creator_id UUID,
  creator_name TEXT,
  creator_profile_picture_url TEXT,
  preparation_time INTEGER,
  items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.image_url,
    c.image_hint,
    c.price,
    c.discount_percentage,
    c.type,
    c.is_available,
    c.available_quantity,
    c.expires_at,
    c.created_at,
    c.updated_at,
    c.creator_id,
    u.name as creator_name,
    u.profile_picture_url as creator_profile_picture_url,
    c.preparation_time,
    (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', ci.id,
            'product_id', ci.product_id,
            'quantity', ci.quantity,
            'price_at_purchase', ci.price_at_purchase,
            'creator_id', ci.creator_id,
            'creator_share_percentage', ci.creator_share_percentage,
            'product', json_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description,
              'image_url', p.image_url,
              'image_hint', p.image_hint,
              'price', p.price,
              'preparation_time', p.preparation_time
            ),
            'creator', json_build_object(
              'id', uc.id,
              'name', uc.name,
              'profile_picture_url', uc.profile_picture_url
            )
          )
        ),
        '[]'::json
      )
      FROM combo_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN users uc ON ci.creator_id = uc.id
      WHERE ci.combo_id = c.id
    ) as items
  FROM combos c
  JOIN users u ON c.creator_id = u.id
  WHERE c.id = combo_id;
END;
$$;

-- 3. Función para obtener combos de un creador específico
CREATE OR REPLACE FUNCTION get_creator_combos(creator_id UUID)
RETURNS TABLE (
  id UUID,
  name JSONB,
  description JSONB,
  image_url TEXT,
  image_hint TEXT,
  price DECIMAL(8,2),
  discount_percentage INTEGER,
  type TEXT,
  is_available BOOLEAN,
  available_quantity INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  preparation_time INTEGER,
  total_items INTEGER,
  total_sales INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.image_url,
    c.image_hint,
    c.price,
    c.discount_percentage,
    c.type,
    c.is_available,
    c.available_quantity,
    c.expires_at,
    c.created_at,
    c.updated_at,
    c.preparation_time,
    (SELECT COUNT(*) FROM combo_items ci WHERE ci.combo_id = c.id)::INTEGER as total_items,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.combo_id = c.id)::INTEGER as total_sales
  FROM combos c
  WHERE c.creator_id = get_creator_combos.creator_id
  ORDER BY c.created_at DESC;
END;
$$;

-- 4. Función para crear un nuevo combo
CREATE OR REPLACE FUNCTION create_combo(
  p_creator_id UUID,
  p_name JSONB,
  p_description JSONB,
  p_image_url TEXT,
  p_image_hint TEXT,
  p_price DECIMAL(8,2),
  p_discount_percentage INTEGER DEFAULT NULL,
  p_type TEXT DEFAULT 'sweet_savory',
  p_available_quantity INTEGER DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_preparation_time INTEGER DEFAULT 2,
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_combo_id UUID;
  item JSONB;
BEGIN
  -- Crear el combo
  INSERT INTO combos (
    creator_id,
    name,
    description,
    image_url,
    image_hint,
    price,
    discount_percentage,
    type,
    available_quantity,
    expires_at,
    preparation_time,
    is_available
  ) VALUES (
    p_creator_id,
    p_name,
    p_description,
    p_image_url,
    p_image_hint,
    p_price,
    p_discount_percentage,
    p_type,
    p_available_quantity,
    p_expires_at,
    p_preparation_time,
    true
  ) RETURNING id INTO new_combo_id;

  -- Agregar los items del combo
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO combo_items (
      combo_id,
      product_id,
      quantity,
      price_at_purchase,
      creator_id,
      creator_share_percentage
    ) VALUES (
      new_combo_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::INTEGER,
      (item->>'price_at_purchase')::DECIMAL(8,2),
      (item->>'creator_id')::UUID,
      (item->>'creator_share_percentage')::DECIMAL(5,2)
    );
  END LOOP;

  RETURN new_combo_id;
END;
$$;

-- 5. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_active_combos() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_combo_details(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_creator_combos(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_combo(UUID, JSONB, JSONB, TEXT, TEXT, DECIMAL, INTEGER, TEXT, INTEGER, TIMESTAMP WITH TIME ZONE, INTEGER, JSONB) TO authenticated;

-- ✅ FUNCIONES DE COMBOS CREADAS EXITOSAMENTE
SELECT 'Funciones de combos creadas exitosamente' as resultado;





