# 📊 GUÍA COMPLETA: SISTEMA DE ANALYTICS PARA E-COMMERCE + DELIVERY

**Para:** Implementar en TASTY (Food Delivery + E-commerce)  
**Basado en:** Sistema exitoso de Shugu Travel Platform  
**Fecha:** 16 Febrero 2026  
**Estado:** Documentación para implementación futura

---

## 🎯 **RESUMEN EJECUTIVO**

Esta guía documenta la implementación completa de un sistema de analytics personalizado para TASTY, una plataforma de e-commerce + food delivery. El sistema está basado en la implementación exitosa de Shugu Travel Platform, adaptado específicamente para el embudo de conversión de food delivery.

### **🔧 COMPONENTES PRINCIPALES:**
1. **Hook personalizado** (`useTastyAnalytics`) para eventos de e-commerce
2. **API Route** (`/api/analytics/track`) con geolocalización automática
3. **Dashboard admin** con métricas específicas de delivery
4. **Base de datos** optimizada para e-commerce analytics
5. **Filtrado inteligente** para excluir admins y bots

---

## 📈 **EVENTOS ESPECÍFICOS PARA E-COMMERCE + DELIVERY**

### **EMBUDO DE CONVERSIÓN COMPLETO:**

```typescript
// DISCOVERY & BROWSING
trackRestaurantView(restaurantId, restaurantName, cuisine, location)
trackSearchFood(query, filters, resultsCount, deliveryZone)
trackCategoryBrowse(categoryId, categoryName, restaurantId)
trackProductView(productId, productName, price, category, restaurantId)

// SHOPPING CART
trackAddToCart(productId, quantity, price, restaurantId, cartTotal)
trackRemoveFromCart(productId, quantity, price, reason)
trackCartView(cartTotal, itemCount, restaurantCount)
trackPromoCodeApplied(promoCode, discount, cartTotal)

// CHECKOUT PROCESS
trackCheckoutStart(cartTotal, itemCount, deliveryZone, estimatedTime)
trackDeliveryAddressSet(zone, isNewAddress, estimatedTime)
trackPaymentMethodSelected(method, cartTotal)
trackPaymentStart(orderId, paymentMethod, total)
trackPaymentComplete(orderId, paymentMethod, total, processingTime)

// ORDER FULFILLMENT
trackOrderConfirmed(orderId, total, estimatedDeliveryTime, restaurantId)
trackOrderPreparing(orderId, prepTime, restaurantId)
trackOrderOutForDelivery(orderId, deliveryStartTime, driverId)
trackOrderDelivered(orderId, actualDeliveryTime, rating, tip)

// ENGAGEMENT & RETENTION
trackRestaurantFavorite(restaurantId, action) // add/remove
trackOrderReorder(originalOrderId, newOrderId, daysSinceOriginal)
trackUserReview(orderId, rating, hasComment, restaurantId)
trackCustomerSupport(orderId, issueType, resolution)
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

### **1. Hook de Analytics Personalizado**
📍 **Archivo:** `src/hooks/useTastyAnalytics.ts`

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';

// Tipos específicos para TASTY
export type TastyEventType = 
  | 'restaurant_view' | 'search_food' | 'category_browse' | 'product_view'
  | 'add_to_cart' | 'remove_from_cart' | 'cart_view' | 'promo_applied'
  | 'checkout_start' | 'address_set' | 'payment_start' | 'payment_complete'
  | 'order_confirmed' | 'order_preparing' | 'order_delivered'
  | 'restaurant_favorite' | 'order_reorder' | 'user_review';

export type EntityType = 'restaurant' | 'product' | 'order' | 'category' | 'promo';

interface TastyTrackEventParams {
  eventType: TastyEventType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  
  // E-commerce específico
  productPrice?: number;
  quantity?: number;
  cartTotal?: number;
  itemCount?: number;
  
  // Delivery específico
  restaurantId?: string;
  restaurantName?: string;
  cuisine?: string;
  deliveryZone?: string;
  estimatedDeliveryTime?: number;
  actualDeliveryTime?: number;
  
  // Payment específico
  paymentMethod?: string;
  promoCode?: string;
  discount?: number;
  
  // Rating & Review
  rating?: number;
  hasComment?: boolean;
  
  // Metadata
  filters?: Record<string, any>;
  resultsCount?: number;
}

// Generar visitor ID único persistente
function getVisitorId(): string {
  const STORAGE_KEY = 'tasty_visitor_id';
  let visitorId = localStorage.getItem(STORAGE_KEY);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, visitorId);
  }
  return visitorId;
}

export function useTastyAnalytics() {
  const { user } = useAuth();
  const { cart } = useCart();
  const visitorIdRef = useRef<string>('');

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);

  // Determinar si debe trackear (excluir admins, delivery drivers, restaurant owners)
  const shouldTrack = useCallback((): boolean => {
    if (!user) return true; // Usuarios anónimos SÍ se trackean
    
    // Excluir roles administrativos
    if (user.roles?.admin || user.roles?.support_agent) {
      console.log('📊 Analytics: Skipping (admin/support)');
      return false;
    }
    
    // Excluir delivery drivers y restaurant owners
    if (user.roles?.delivery_driver || user.roles?.restaurant_owner) {
      console.log('📊 Analytics: Skipping (driver/restaurant)');
      return false;
    }
    
    return true;
  }, [user]);

  // Función principal de tracking
  const trackEvent = useCallback(async (params: TastyTrackEventParams) => {
    if (!shouldTrack()) return;

    try {
      const payload = {
        visitor_id: visitorIdRef.current,
        user_id: user?.id || null,
        is_logged_in: !!user,
        event_type: params.eventType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        
        // E-commerce data
        product_price: params.productPrice,
        quantity: params.quantity,
        cart_total: params.cartTotal,
        item_count: params.itemCount,
        
        // Delivery data
        restaurant_id: params.restaurantId,
        restaurant_name: params.restaurantName,
        cuisine: params.cuisine,
        delivery_zone: params.deliveryZone,
        estimated_delivery_time: params.estimatedDeliveryTime,
        actual_delivery_time: params.actualDeliveryTime,
        
        // Payment data
        payment_method: params.paymentMethod,
        promo_code: params.promoCode,
        discount: params.discount,
        
        // Review data
        rating: params.rating,
        has_comment: params.hasComment,
        
        // Search data
        search_filters: params.filters,
        results_count: params.resultsCount,
        
        // Auto-calculated
        cart_item_count: cart?.items?.length || 0,
        current_cart_total: cart?.total || 0,
        
        // Timestamp
        event_timestamp: new Date().toISOString()
      };

      // Fire and forget - no esperar respuesta
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silenciar errores - analytics nunca debe romper UX
      });

      console.log('📊 Analytics tracked:', params.eventType, params.entityType);
    } catch (error) {
      // Silenciar errores
      console.warn('📊 Analytics failed:', error);
    }
  }, [shouldTrack, user, cart]);

  // Funciones específicas para diferentes eventos
  const trackRestaurantView = useCallback((restaurant: any) => {
    trackEvent({
      eventType: 'restaurant_view',
      entityType: 'restaurant',
      entityId: restaurant.id,
      entityName: restaurant.name,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      deliveryZone: restaurant.deliveryZone
    });
  }, [trackEvent]);

  const trackProductView = useCallback((product: any) => {
    trackEvent({
      eventType: 'product_view',
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      productPrice: product.price,
      restaurantId: product.restaurantId,
      restaurantName: product.restaurantName
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((product: any, quantity: number) => {
    trackEvent({
      eventType: 'add_to_cart',
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      productPrice: product.price,
      quantity: quantity,
      restaurantId: product.restaurantId,
      cartTotal: (cart?.total || 0) + (product.price * quantity)
    });
  }, [trackEvent, cart]);

  const trackCheckoutStart = useCallback((checkoutData: any) => {
    trackEvent({
      eventType: 'checkout_start',
      entityType: 'order',
      cartTotal: checkoutData.total,
      itemCount: checkoutData.itemCount,
      deliveryZone: checkoutData.deliveryZone,
      estimatedDeliveryTime: checkoutData.estimatedTime
    });
  }, [trackEvent]);

  const trackOrderComplete = useCallback((order: any) => {
    trackEvent({
      eventType: 'order_confirmed',
      entityType: 'order',
      entityId: order.id,
      cartTotal: order.total,
      restaurantId: order.restaurantId,
      deliveryZone: order.deliveryZone,
      paymentMethod: order.paymentMethod,
      estimatedDeliveryTime: order.estimatedDeliveryTime
    });
  }, [trackEvent]);

  const trackSearchFood = useCallback((searchData: any) => {
    trackEvent({
      eventType: 'search_food',
      entityType: 'product',
      entityName: searchData.query,
      filters: searchData.filters,
      resultsCount: searchData.resultsCount,
      deliveryZone: searchData.deliveryZone
    });
  }, [trackEvent]);

  return {
    trackRestaurantView,
    trackProductView,
    trackAddToCart,
    trackCheckoutStart,
    trackOrderComplete,
    trackSearchFood,
    trackEvent // Para eventos custom
  };
}
```

### **2. API Route para Tracking**
📍 **Archivo:** `app/api/analytics/track/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role para bypass RLS
);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // ======================================== 
    // EXTRAER GEOLOCALIZACIÓN DE VERCEL HEADERS
    // ========================================
    const countryCode = request.headers.get('x-vercel-ip-country') || null;
    const city = request.headers.get('x-vercel-ip-city') || null;
    const region = request.headers.get('x-vercel-ip-country-region') || null;

    // ========================================
    // DETECTAR DISPOSITIVO DESDE USER-AGENT
    // ========================================
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);

    // ========================================
    // DETECTAR FUENTE DE TRÁFICO
    // ========================================
    const referrer = request.headers.get('referer') || '';
    const referrerSource = getReferrerSource(referrer);

    // ========================================
    // DETECTAR HORARIO PICO DE DELIVERY
    // ========================================
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);

    // ========================================
    // GUARDAR EN SUPABASE
    // ========================================
    const analyticsData = {
      ...payload,
      // Geolocalización automática
      country_code: countryCode,
      city: city,
      region: region,
      // Device detection
      device_type: deviceType,
      user_agent: userAgent,
      // Traffic source
      referrer_source: referrerSource,
      // Delivery context
      is_peak_hour: isPeakHour,
      hour_of_day: hour,
      day_of_week: new Date().getDay(),
      // Timestamps
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('tasty_analytics')
      .insert([analyticsData]);

    if (error) {
      console.error('Analytics insert error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    // Siempre retornar 200 - analytics no debe romper la app
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getReferrerSource(referrer: string): string {
  if (!referrer) return 'direct';
  if (referrer.includes('google.com')) return 'google';
  if (referrer.includes('facebook.com')) return 'facebook';
  if (referrer.includes('instagram.com')) return 'instagram';
  if (referrer.includes('tiktok.com')) return 'tiktok';
  if (referrer.includes('uber.com')) return 'uber';
  if (referrer.includes('rappi.com')) return 'rappi';
  return 'other';
}

export async function GET() {
  return NextResponse.json({ status: 'TASTY Analytics API is running' });
}
```

### **3. Schema de Base de Datos**
📍 **Archivo:** `sql/create-tasty-analytics.sql`

```sql
-- ===================================================================
-- TABLA: tasty_analytics
-- Propósito: Rastrear eventos de e-commerce y delivery
-- ===================================================================

CREATE TABLE IF NOT EXISTS tasty_analytics (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificación del visitante/usuario
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  is_logged_in BOOLEAN DEFAULT false,
  
  -- Geolocalización (desde Vercel headers)
  country_code TEXT,
  city TEXT,
  region TEXT,
  
  -- Dispositivo y navegador
  device_type TEXT, -- mobile/desktop/tablet
  user_agent TEXT,
  referrer_source TEXT,
  
  -- Evento y entidad
  event_type TEXT NOT NULL, -- restaurant_view/product_view/add_to_cart/order_confirmed/etc
  entity_type TEXT NOT NULL, -- restaurant/product/order/category/promo
  entity_id TEXT,
  entity_name TEXT,
  
  -- Datos específicos de e-commerce
  product_price DECIMAL(10,2),
  quantity INTEGER,
  cart_total DECIMAL(10,2),
  item_count INTEGER,
  
  -- Datos específicos de delivery
  restaurant_id TEXT,
  restaurant_name TEXT,
  cuisine TEXT,
  delivery_zone TEXT,
  estimated_delivery_time INTEGER, -- minutos
  actual_delivery_time INTEGER, -- minutos
  
  -- Datos de pago
  payment_method TEXT, -- card/cash/digital_wallet
  promo_code TEXT,
  discount DECIMAL(10,2),
  
  -- Datos de review y rating
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  has_comment BOOLEAN,
  
  -- Datos de búsqueda
  search_filters JSONB DEFAULT '{}',
  results_count INTEGER,
  
  -- Context temporal (para análisis de patrones)
  is_peak_hour BOOLEAN,
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Timestamps
  event_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA CONSULTAS RÁPIDAS
-- ========================================
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_visitor ON tasty_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_event ON tasty_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_entity ON tasty_analytics(entity_type);
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_restaurant ON tasty_analytics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_timestamp ON tasty_analytics(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_country ON tasty_analytics(country_code);
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_delivery_zone ON tasty_analytics(delivery_zone);
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_peak_hour ON tasty_analytics(is_peak_hour, hour_of_day);

-- Índice compuesto para análisis de conversión
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_conversion ON tasty_analytics(visitor_id, event_type, event_timestamp);

-- Índice para análisis de restaurantes
CREATE INDEX IF NOT EXISTS idx_tasty_analytics_restaurant_performance ON tasty_analytics(restaurant_id, event_type, event_timestamp);

-- ========================================
-- RLS (ROW LEVEL SECURITY)
-- ========================================
ALTER TABLE tasty_analytics ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede insertar (tracking anónimo)
CREATE POLICY "Anyone can insert analytics" ON tasty_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Solo admins pueden leer
CREATE POLICY "Admins can read analytics" ON tasty_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND ('admin' = ANY(users.roles) OR 'analytics_viewer' = ANY(users.roles))
    )
  );

-- ========================================
-- FUNCIONES PARA ANÁLISIS RÁPIDO
-- ========================================

-- Función para calcular conversion rate
CREATE OR REPLACE FUNCTION calculate_conversion_rate(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
  total_product_views BIGINT,
  total_add_to_cart BIGINT,
  total_checkout_starts BIGINT,
  total_orders BIGINT,
  view_to_cart_rate DECIMAL,
  cart_to_checkout_rate DECIMAL,
  checkout_to_order_rate DECIMAL,
  overall_conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      COUNT(*) FILTER (WHERE event_type = 'product_view') as product_views,
      COUNT(*) FILTER (WHERE event_type = 'add_to_cart') as add_to_carts,
      COUNT(*) FILTER (WHERE event_type = 'checkout_start') as checkout_starts,
      COUNT(*) FILTER (WHERE event_type = 'order_confirmed') as orders
    FROM tasty_analytics
    WHERE event_timestamp >= start_date 
      AND event_timestamp <= end_date
  )
  SELECT 
    product_views,
    add_to_carts,
    checkout_starts,
    orders,
    CASE WHEN product_views > 0 THEN ROUND((add_to_carts::DECIMAL / product_views) * 100, 2) ELSE 0 END,
    CASE WHEN add_to_carts > 0 THEN ROUND((checkout_starts::DECIMAL / add_to_carts) * 100, 2) ELSE 0 END,
    CASE WHEN checkout_starts > 0 THEN ROUND((orders::DECIMAL / checkout_starts) * 100, 2) ELSE 0 END,
    CASE WHEN product_views > 0 THEN ROUND((orders::DECIMAL / product_views) * 100, 2) ELSE 0 END
  FROM funnel_data;
END;
$$ LANGUAGE plpgsql;

-- Función para top restaurantes
CREATE OR REPLACE FUNCTION get_top_restaurants(
  days_back INTEGER DEFAULT 7,
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
  restaurant_id TEXT,
  restaurant_name TEXT,
  total_orders BIGINT,
  total_revenue DECIMAL,
  avg_order_value DECIMAL,
  avg_delivery_time DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.restaurant_id,
    ta.restaurant_name,
    COUNT(*) FILTER (WHERE ta.event_type = 'order_confirmed') as total_orders,
    SUM(ta.cart_total) FILTER (WHERE ta.event_type = 'order_confirmed') as total_revenue,
    AVG(ta.cart_total) FILTER (WHERE ta.event_type = 'order_confirmed') as avg_order_value,
    AVG(ta.actual_delivery_time) FILTER (WHERE ta.actual_delivery_time IS NOT NULL) as avg_delivery_time
  FROM tasty_analytics ta
  WHERE ta.event_timestamp >= NOW() - (days_back || ' days')::INTERVAL
    AND ta.restaurant_id IS NOT NULL
  GROUP BY ta.restaurant_id, ta.restaurant_name
  ORDER BY total_orders DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE tasty_analytics IS 'Rastrea eventos de e-commerce y delivery para TASTY';
COMMENT ON COLUMN tasty_analytics.visitor_id IS 'ID único temporal almacenado en localStorage';
COMMENT ON COLUMN tasty_analytics.is_peak_hour IS 'True si el evento ocurrió en horario pico (11-14h o 18-21h)';
COMMENT ON COLUMN tasty_analytics.delivery_zone IS 'Zona de delivery para análisis geográfico';
COMMENT ON COLUMN tasty_analytics.actual_delivery_time IS 'Tiempo real de delivery en minutos';
```

### **4. Dashboard de Analytics**
📍 **Archivo:** `app/admin/tasty-analytics/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  // KPIs principales
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
  
  // Datos para gráficos
  ordersByHour: Array<{hour: number, orders: number, revenue: number}>;
  topRestaurants: Array<{name: string, orders: number, revenue: number}>;
  conversionFunnel: Array<{step: string, count: number, rate: number}>;
  deliveryZones: Array<{zone: string, orders: number, avgTime: number}>;
  deviceBreakdown: Array<{device: string, percentage: number}>;
}

export default function TastyAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tasty-analytics?range=${dateRange}`);
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando analytics...</div>;
  }

  if (!data) {
    return <div className="p-8">Error cargando datos</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">TASTY Analytics</h1>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="1d">Último día</option>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
        </select>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalOrders.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ticket Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Órdenes por Hora</TabsTrigger>
          <TabsTrigger value="restaurants">Top Restaurantes</TabsTrigger>
          <TabsTrigger value="funnel">Embudo de Conversión</TabsTrigger>
          <TabsTrigger value="delivery">Zonas de Delivery</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes y Revenue por Hora</CardTitle>
              <CardDescription>Patrones de demanda durante el día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.ordersByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Órdenes" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurants">
          <Card>
            <CardHeader>
              <CardTitle>Top Restaurantes</CardTitle>
              <CardDescription>Restaurantes con más órdenes y revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.topRestaurants} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#8884d8" name="Órdenes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Embudo de Conversión</CardTitle>
              <CardDescription>Desde vista de producto hasta orden completada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.conversionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Usuarios" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Zonas de Delivery</CardTitle>
              <CardDescription>Órdenes y tiempo promedio por zona</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.deliveryZones.map((zone, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <div className="font-semibold">{zone.zone}</div>
                      <div className="text-sm text-gray-600">{zone.orders} órdenes</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{zone.avgTime} min</div>
                      <div className="text-sm text-gray-600">tiempo promedio</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos</CardTitle>
              <CardDescription>Distribución por tipo de dispositivo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={data.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({device, percentage}) => `${device}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                  >
                    {data.deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### **5. Componente de Auto-tracking**
📍 **Archivo:** `components/analytics/TastyPageTracker.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTastyAnalytics } from '@/hooks/useTastyAnalytics';

export function TastyPageTracker() {
  const pathname = usePathname();
  const { trackEvent } = useTastyAnalytics();

  useEffect(() => {
    // Delay para asegurar que el contexto esté cargado
    const timer = setTimeout(() => {
      // Determinar tipo de página y trackear apropiadamente
      if (pathname.includes('/restaurant/')) {
        const restaurantId = pathname.split('/restaurant/')[1];
        // trackRestaurantView se llamará desde el componente específico
      } else if (pathname.includes('/product/')) {
        const productId = pathname.split('/product/')[1];
        // trackProductView se llamará desde el componente específico
      } else {
        // Track page view genérico
        trackEvent({
          eventType: 'page_view' as any,
          entityType: 'page' as any,
          entityName: pathname
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, trackEvent]);

  return null;
}
```

---

## 🚀 **PROCESO DE IMPLEMENTACIÓN**

### **FASE 1: SETUP BÁSICO (Semana 1)**
1. **Instalar dependencias**
   ```bash
   npm install @supabase/supabase-js recharts @radix-ui/react-tabs
   ```

2. **Crear tabla en Supabase**
   - Ejecutar `sql/create-tasty-analytics.sql`
   - Configurar RLS policies

3. **Implementar hook básico**
   - Crear `useTastyAnalytics.ts`
   - Implementar eventos críticos: `trackProductView`, `trackAddToCart`, `trackOrderComplete`

4. **Crear API route**
   - Implementar `/api/analytics/track`
   - Configurar geolocalización con Vercel headers

### **FASE 2: EVENTOS CRÍTICOS (Semana 2)**
1. **Integrar en componentes clave**
   - Página de producto → `trackProductView`
   - Botón "Agregar al carrito" → `trackAddToCart`
   - Checkout → `trackCheckoutStart`
   - Confirmación de orden → `trackOrderComplete`

2. **Implementar filtrado**
   - Excluir admins, delivery drivers, restaurant owners
   - Configurar visitor ID persistente

3. **Testing básico**
   - Verificar que los eventos se registren correctamente
   - Probar geolocalización en producción

### **FASE 3: DASHBOARD Y MÉTRICAS (Semana 3-4)**
1. **Crear dashboard admin**
   - Implementar página de analytics
   - Agregar gráficos con Recharts
   - Configurar filtros por fecha

2. **Implementar métricas clave**
   - Conversion rate por embudo
   - Revenue por restaurante
   - Análisis por zona de delivery
   - Patrones temporales (horas pico)

3. **Optimizaciones**
   - Índices de base de datos
   - Caching de consultas frecuentes
   - Performance monitoring

### **FASE 4: INSIGHTS AVANZADOS (Semana 5-6)**
1. **Análisis predictivo**
   - Identificar usuarios en riesgo de churn
   - Predicción de demanda por zona/hora
   - Recomendaciones de cross-selling

2. **Alertas automáticas**
   - Caída en conversión
   - Aumento en tiempo de delivery
   - Problemas con restaurantes específicos

3. **Integración con negocio**
   - Reportes automáticos para stakeholders
   - API para otros sistemas
   - Exportación de datos

---

## 📊 **MÉTRICAS CLAVE A MONITOREAR**

### **1. CONVERSION FUNNEL**
- **Product Views** → **Add to Cart** (típico: 15-25%)
- **Add to Cart** → **Checkout Start** (típico: 60-80%)
- **Checkout Start** → **Order Complete** (típico: 80-90%)
- **Overall Conversion** (típico: 8-18% para food delivery)

### **2. BUSINESS METRICS**
- **Average Order Value (AOV)** por zona/restaurante
- **Revenue per User** y **Lifetime Value**
- **Order Frequency** y **Retention Rate**
- **Commission Revenue** por restaurante

### **3. OPERATIONAL METRICS**
- **Delivery Time** por zona (target: <30 min)
- **Peak Hours** performance (11-14h, 18-21h)
- **Restaurant Performance** (órdenes, ratings, delivery time)
- **Customer Satisfaction** (ratings, reviews, complaints)

### **4. MARKETING METRICS**
- **Traffic Sources** (organic, paid, referral)
- **Geographic Performance** (países, ciudades, zonas)
- **Device Usage** (mobile vs desktop)
- **Campaign Attribution** (UTM tracking)

---

## 🎯 **ROI ESPERADO**

### **OPTIMIZACIONES BASADAS EN DATA:**
1. **Reducir abandono de carrito** (70% → 50%) = +40% conversión
2. **Optimizar horarios de promociones** = +15% órdenes en horas valle
3. **Mejorar tiempo de delivery** = +20% customer satisfaction
4. **Cross-selling inteligente** = +25% AOV
5. **Retención de usuarios** = +30% repeat orders

### **IMPACTO EN REVENUE:**
- **Mes 1-2:** Baseline establecido, optimizaciones básicas (+5-10%)
- **Mes 3-4:** Optimizaciones de conversión (+15-25%)
- **Mes 5-6:** Insights avanzados y predicción (+25-40%)
- **Año 1:** ROI esperado de 300-500% sobre inversión en desarrollo

---

## 🚨 **CONSIDERACIONES IMPORTANTES**

### **1. PRIVACY & COMPLIANCE**
- **GDPR/CCPA compliance** - Visitor IDs anónimos hasta login
- **Cookie policy** - Explicar uso de localStorage
- **Data retention** - Política de limpieza de datos antiguos

### **2. PERFORMANCE**
- **Fire and forget** - Analytics nunca debe bloquear UX
- **Batch processing** - Procesar eventos en background
- **Database optimization** - Índices y particionado por fecha

### **3. ESCALABILIDAD**
- **Tabla puede crecer rápido** - Considerar particionado mensual
- **Agregaciones pre-calculadas** - Para dashboards rápidos
- **CDN para dashboard** - Si se accede frecuentemente

### **4. MONITORING**
- **Error tracking** - Alertas si analytics fallan
- **Data quality** - Validación de eventos duplicados
- **Performance monitoring** - Tiempo de respuesta de API

---

## 🔧 **CONFIGURACIÓN NECESARIA**

### **Variables de Entorno**
```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=5000
```

### **Dependencias**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.47.10",
    "recharts": "^2.8.0",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-select": "^2.1.6"
  }
}
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **✅ SETUP INICIAL:**
- [ ] Crear tabla `tasty_analytics` en Supabase
- [ ] Configurar RLS policies
- [ ] Crear índices de performance
- [ ] Configurar variables de entorno

### **✅ CÓDIGO BASE:**
- [ ] Implementar `useTastyAnalytics` hook
- [ ] Crear API route `/api/analytics/track`
- [ ] Agregar componente `TastyPageTracker`
- [ ] Configurar filtrado de roles

### **✅ EVENTOS CRÍTICOS:**
- [ ] `trackProductView` en páginas de producto
- [ ] `trackAddToCart` en botones de carrito
- [ ] `trackCheckoutStart` en inicio de checkout
- [ ] `trackOrderComplete` en confirmación

### **✅ DASHBOARD:**
- [ ] Página de analytics admin
- [ ] Gráficos con Recharts
- [ ] Filtros por fecha y tipo
- [ ] KPIs principales

### **✅ TESTING:**
- [ ] Verificar eventos en desarrollo
- [ ] Probar geolocalización en producción
- [ ] Validar filtrado de admins
- [ ] Performance testing con volumen

### **✅ OPTIMIZACIÓN:**
- [ ] Índices de base de datos optimizados
- [ ] Caching de consultas frecuentes
- [ ] Alertas de monitoreo
- [ ] Documentación completa

---

## 🎯 **PRÓXIMOS PASOS RECOMENDADOS**

### **DESPUÉS DE IMPLEMENTACIÓN BÁSICA:**

1. **Machine Learning Integration**
   - Predicción de churn de usuarios
   - Recomendaciones personalizadas
   - Optimización de precios dinámicos

2. **Advanced Segmentation**
   - Cohort analysis
   - RFM analysis (Recency, Frequency, Monetary)
   - Customer lifetime value prediction

3. **Real-time Alerts**
   - Caída súbita en conversión
   - Problemas de performance por zona
   - Anomalías en patrones de pedidos

4. **Integration con Marketing**
   - Attribution modeling
   - Campaign performance tracking
   - A/B testing framework

---

**¡Con esta implementación tendrás un sistema de analytics de nivel enterprise para TASTY!** 🚀

Este sistema te dará insights profundos sobre el comportamiento de usuarios, performance de restaurantes, y oportunidades de optimización que pueden incrementar significativamente el revenue y la satisfacción del cliente.