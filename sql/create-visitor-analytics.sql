-- =============================================
-- TABLA DE ANALYTICS DE VISITANTES
-- Para rastrear visitas, páginas vistas, dispositivos, países
-- =============================================

-- Crear tabla de analytics
CREATE TABLE IF NOT EXISTS visitor_analytics (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificación del visitante
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  is_logged_in BOOLEAN DEFAULT false,
  
  -- Geolocalización (desde Vercel headers automáticos)
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  
  -- Dispositivo
  device_type TEXT, -- mobile/desktop/tablet
  user_agent TEXT,
  browser_language TEXT,
  
  -- Evento
  event_type TEXT NOT NULL, -- page_view/product_view/creator_view/add_to_cart/checkout/purchase
  
  -- Página/Entidad vista
  page_path TEXT,
  entity_type TEXT, -- product/creator/combo/page
  entity_id TEXT,
  entity_name TEXT,
  
  -- Para productos
  product_category TEXT,
  product_price DECIMAL(10,2),
  creator_id TEXT,
  creator_name TEXT,
  
  -- Para compras
  order_id TEXT,
  order_total DECIMAL(10,2),
  items_count INTEGER,
  
  -- Tráfico
  referrer TEXT,
  referrer_source TEXT, -- google/facebook/instagram/whatsapp/direct
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_created ON visitor_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_visitor ON visitor_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_country ON visitor_analytics(country_code);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_event ON visitor_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_entity ON visitor_analytics(entity_type);
-- Nota: No se puede crear índice funcional sobre created_at::date porque timestamptz depende de timezone
-- El índice sobre created_at ya cubre consultas por rango de fechas

-- RLS: Solo admins pueden leer, API puede insertar
ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Política para que admins lean todo
CREATE POLICY "Admins can read all analytics" ON visitor_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );

-- Política para insertar (service role lo hace via API)
CREATE POLICY "Service role can insert analytics" ON visitor_analytics
  FOR INSERT
  WITH CHECK (true);

-- =============================================
-- FUNCIÓN PARA OBTENER RESUMEN DE ANALYTICS
-- =============================================

CREATE OR REPLACE FUNCTION get_visitor_analytics_summary(
  days_back INTEGER DEFAULT 7
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_visits', (
      SELECT COUNT(*) FROM visitor_analytics 
      WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'unique_visitors', (
      SELECT COUNT(DISTINCT visitor_id) FROM visitor_analytics 
      WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'page_views', (
      SELECT COUNT(*) FROM visitor_analytics 
      WHERE event_type = 'page_view' 
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'product_views', (
      SELECT COUNT(*) FROM visitor_analytics 
      WHERE event_type = 'product_view' 
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'add_to_cart', (
      SELECT COUNT(*) FROM visitor_analytics 
      WHERE event_type = 'add_to_cart' 
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'purchases', (
      SELECT COUNT(*) FROM visitor_analytics 
      WHERE event_type = 'purchase' 
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'top_countries', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT country_code, country_name, COUNT(*) as visits
        FROM visitor_analytics 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND country_code IS NOT NULL
        GROUP BY country_code, country_name
        ORDER BY visits DESC
        LIMIT 10
      ) t
    ),
    'devices', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT device_type, COUNT(*) as count
        FROM visitor_analytics 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC
      ) t
    ),
    'visits_by_day', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT created_at::date as date, COUNT(*) as visits, COUNT(DISTINCT visitor_id) as unique_visitors
        FROM visitor_analytics 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY created_at::date
        ORDER BY date
      ) t
    ),
    'top_pages', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT page_path, COUNT(*) as views
        FROM visitor_analytics 
        WHERE event_type = 'page_view'
        AND created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND page_path IS NOT NULL
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 10
      ) t
    ),
    'top_products', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT entity_id, entity_name, COUNT(*) as views
        FROM visitor_analytics 
        WHERE event_type = 'product_view'
        AND created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND entity_id IS NOT NULL
        GROUP BY entity_id, entity_name
        ORDER BY views DESC
        LIMIT 10
      ) t
    ),
    'referrer_sources', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT referrer_source, COUNT(*) as count
        FROM visitor_analytics 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND referrer_source IS NOT NULL
        GROUP BY referrer_source
        ORDER BY count DESC
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
