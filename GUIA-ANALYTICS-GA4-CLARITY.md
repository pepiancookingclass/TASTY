# 📊 GUÍA COMPLETA: IMPLEMENTACIÓN GA4 + CLARITY EN TASTY

Para: Otra IA que necesita implementar analytics  
Fecha: 16 Febrero 2026  
App: TASTY (Next.js + Supabase + Vercel)  
Destino: Implementar en Shugu Travel Platform

---

## 🎯 RESUMEN EJECUTIVO

Esta guía detalla la implementación completa de Google Analytics 4 (GA4) y Microsoft Clarity en TASTY, incluyendo:
- Sistema de analytics interno personalizado
- Integración con Vercel headers para geolocalización
- Filtrado inteligente para excluir admins
- Dashboard completo de métricas

### 🔧 COMPONENTES PRINCIPALES:
1. **Analytics Interno**: Hook personalizado + API Route + Dashboard
2. **Google Analytics 4**: Tracking automático + eventos personalizados
3. **Microsoft Clarity**: Grabaciones + mapas de calor
4. **Filtrado Inteligente**: Excluye admins para datos limpios

---

## 📁 ARCHIVOS IMPLEMENTADOS

### 1. Sistema de Analytics Interno

#### **Hook de Analytics**
📍 **Archivo:** `src/hooks/useVisitorAnalytics.ts`

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useUserRoles } from '@/hooks/useUserRoles';

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

export function useVisitorAnalytics() {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const visitorIdRef = useRef<string>('');

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);

  // Determinar si debe trackear (excluir admins/creators/agents)
  const shouldTrack = useCallback((): boolean => {
    // Excluir roles administrativos
    if (roles.some(role => ['admin', 'creator', 'agent'].includes(role))) {
      console.log('📊 Analytics: Skipping (admin/creator)');
      return false;
    }
    return true;
  }, [roles]);

  // Función principal de tracking
  const trackEvent = useCallback(async (params: {
    eventType: 'page_view' | 'product_view' | 'creator_view' | 'add_to_cart' | 'checkout' | 'purchase';
    entityType?: 'product' | 'creator' | 'page';
    entityId?: string;
    entityName?: string;
    productPrice?: number;
    orderTotal?: number;
    // ... más parámetros
  }) => {
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
        // ... más datos
      };

      // Fire and forget - no esperar respuesta
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silenciar errores - analytics nunca debe romper UX
      });
    } catch (error) {
      // Silenciar errores
    }
  }, [shouldTrack, user]);

  // Funciones específicas
  const trackPageView = useCallback((path: string) => {
    trackEvent({
      eventType: 'page_view',
      entityType: 'page',
      entityName: path
    });
  }, [trackEvent]);

  const trackProductView = useCallback((productId: string, productName: string, price: number) => {
    trackEvent({
      eventType: 'product_view',
      entityType: 'product',
      entityId: productId,
      entityName: productName,
      productPrice: price
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((productId: string, productName: string, price: number) => {
    trackEvent({
      eventType: 'add_to_cart',
      entityType: 'product',
      entityId: productId,
      entityName: productName,
      productPrice: price
    });
  }, [trackEvent]);

  const trackPurchase = useCallback((orderId: string, total: number) => {
    trackEvent({
      eventType: 'purchase',
      entityId: orderId,
      orderTotal: total
    });
  }, [trackEvent]);

  return {
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackPurchase
  };
}
```

#### **API Route para Tracking**
📍 **Archivo:** `src/app/api/analytics/track/route.ts`

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
      // Timestamps
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('visitor_analytics')
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
  return 'other';
}

export async function GET() {
  return NextResponse.json({ status: 'Analytics API is running' });
}
```

#### **Componente de Auto-tracking**
📍 **Archivo:** `src/components/analytics/PageViewTracker.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useVisitorAnalytics } from '@/hooks/useVisitorAnalytics';

export function PageViewTracker() {
  const pathname = usePathname();
  const { trackPageView } = useVisitorAnalytics();

  useEffect(() => {
    // Delay para asegurar que el contexto de auth esté cargado
    const timer = setTimeout(() => {
      trackPageView(pathname);
      console.log('📊 Analytics tracked: page_view', pathname);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, trackPageView]);

  return null; // No renderiza nada
}
```

### 2. Integración GA4 + Clarity Condicional

#### **Componente de Analytics Condicional**
📍 **Archivo:** `src/components/analytics/ConditionalAnalytics.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';

export function ConditionalAnalytics() {
  const { roles, loading } = useUserRoles();

  useEffect(() => {
    if (loading) return;

    // Solo cargar analytics si NO es admin, creator o agent
    const isExcludedRole = roles.some(role => ['admin', 'creator', 'agent'].includes(role));
    
    if (!isExcludedRole) {
      // ========================================
      // CARGAR GOOGLE ANALYTICS 4
      // ========================================
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-MJSSW7R01F';
      document.head.appendChild(gtagScript);

      const gtagConfig = document.createElement('script');
      gtagConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-MJSSW7R01F');
      `;
      document.head.appendChild(gtagConfig);

      // ========================================
      // CARGAR MICROSOFT CLARITY
      // ========================================
      const clarityScript = document.createElement('script');
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "vicdzd41fb");
      `;
      document.head.appendChild(clarityScript);

      console.log('📊 Analytics cargados para usuario regular');
    } else {
      console.log('📊 Analytics: Skipping (admin/creator/agent)');
    }
  }, [roles, loading]);

  return null;
}
```

#### **Layout Principal**
📍 **Archivo:** `src/app/layout.tsx`

```typescript
import { ConditionalAnalytics } from '@/components/analytics/ConditionalAnalytics';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Analytics se cargan condicionalmente via ConditionalAnalytics */}
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            {/* App content */}
            {children}
            
            {/* Analytics Components */}
            <ConditionalAnalytics />
            <PageViewTracker />
            <Analytics /> {/* Vercel Analytics */}
            <SpeedInsights /> {/* Vercel Speed Insights */}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Base de Datos (Supabase)

#### **Tabla SQL**
📍 **Archivo:** `sql/create-visitor-analytics.sql`

```sql
-- Crear tabla de analytics de visitantes
CREATE TABLE IF NOT EXISTS visitor_analytics (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificación del visitante
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
  browser_language TEXT,
  
  -- Evento y entidad
  event_type TEXT NOT NULL, -- page_view/product_view/add_to_cart/purchase
  entity_type TEXT, -- product/creator/page
  entity_id TEXT,
  entity_name TEXT,
  
  -- Datos específicos del evento
  product_price DECIMAL(10,2),
  order_total DECIMAL(10,2),
  
  -- Fuente de tráfico
  referrer_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_visitor ON visitor_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_event ON visitor_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_country ON visitor_analytics(country_code);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_created ON visitor_analytics(created_at);

-- RLS (Row Level Security)
ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Policy para que admins puedan leer todo
CREATE POLICY "Admins can read all analytics" ON visitor_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );
```

### 4. Dashboard de Analytics

#### **Servicios de Analytics**
📍 **Archivo:** `src/lib/services/analytics.ts`

```typescript
import { supabase } from '@/lib/supabase';

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  purchases: number;
  conversionRate: number;
}

export async function getVisitorStats(days: number = 7): Promise<VisitorStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Obtener estadísticas básicas
  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('*')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      pageViews: 0,
      productViews: 0,
      addToCarts: 0,
      purchases: 0,
      conversionRate: 0
    };
  }

  // Calcular métricas
  const uniqueVisitors = new Set(data.map(d => d.visitor_id)).size;
  const pageViews = data.filter(d => d.event_type === 'page_view').length;
  const productViews = data.filter(d => d.event_type === 'product_view').length;
  const addToCarts = data.filter(d => d.event_type === 'add_to_cart').length;
  const purchases = data.filter(d => d.event_type === 'purchase').length;
  
  const conversionRate = productViews > 0 ? (purchases / productViews) * 100 : 0;

  return {
    totalVisits: data.length,
    uniqueVisitors,
    pageViews,
    productViews,
    addToCarts,
    purchases,
    conversionRate: Math.round(conversionRate * 100) / 100
  };
}

export async function getVisitorsByCountry(days: number = 7): Promise<Array<{country: string, visitors: number}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('country_code, visitor_id')
    .gte('created_at', startDate.toISOString())
    .not('country_code', 'is', null);

  if (error || !data) return [];

  // Agrupar por país y contar visitantes únicos
  const countryMap = new Map();
  data.forEach(item => {
    if (!countryMap.has(item.country_code)) {
      countryMap.set(item.country_code, new Set());
    }
    countryMap.get(item.country_code).add(item.visitor_id);
  });

  return Array.from(countryMap.entries())
    .map(([country, visitors]) => ({
      country,
      visitors: visitors.size
    }))
    .sort((a, b) => b.visitors - a.visitors);
}

// ... más funciones de analytics
```

---

## 🔧 CONFIGURACIÓN NECESARIA

### Variables de Entorno
```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-MJSSW7R01F

# Microsoft Clarity  
NEXT_PUBLIC_CLARITY_ID=vicdzd41fb
```

### Dependencias
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.47.10",
    "@vercel/analytics": "^1.1.1",
    "@vercel/speed-insights": "^1.0.10",
    "recharts": "^2.8.0"
  }
}
```

---

## 🚀 PROCESO DE IMPLEMENTACIÓN

### Paso 1: Configurar Cuentas Externas
1. **Google Analytics 4:**
   - Crear propiedad en [analytics.google.com](https://analytics.google.com)
   - Obtener Measurement ID (G-XXXXXXXX)
   
2. **Microsoft Clarity:**
   - Crear proyecto en [clarity.microsoft.com](https://clarity.microsoft.com)
   - Obtener Project ID

### Paso 2: Crear Tabla en Supabase
```sql
-- Ejecutar el SQL de visitor_analytics
-- Configurar RLS policies
-- Crear índices para performance
```

### Paso 3: Implementar Hook de Analytics
- Crear `useVisitorAnalytics.ts`
- Implementar funciones de tracking
- Configurar filtrado de roles

### Paso 4: Crear API Route
- Implementar `/api/analytics/track`
- Configurar geolocalización con Vercel headers
- Implementar detección de dispositivos

### Paso 5: Integrar en Layout
- Agregar `ConditionalAnalytics`
- Agregar `PageViewTracker`
- Configurar carga condicional

### Paso 6: Crear Dashboard
- Implementar servicios de analytics
- Crear página de dashboard
- Agregar gráficos y métricas

---

## 📊 MÉTRICAS QUE OBTIENES

### Dashboard Interno
- **KPIs:** Visitas totales, visitantes únicos, conversión
- **Geolocalización:** Países, ciudades, regiones
- **Dispositivos:** Mobile/desktop/tablet breakdown
- **Eventos:** Page views, product views, add to cart, purchases
- **Fuentes:** Direct, Google, Facebook, Instagram
- **Tendencias:** Gráficos por día/semana/mes

### Google Analytics 4
- **Audiencia:** Demografía, intereses, comportamiento
- **Adquisición:** Canales de tráfico, campañas
- **Comportamiento:** Páginas populares, flujos de usuarios
- **Conversiones:** Objetivos personalizados, embudos

### Microsoft Clarity
- **Grabaciones:** Videos de sesiones reales
- **Heatmaps:** Mapas de calor de clics y scroll
- **Insights:** Problemas de UX detectados automáticamente
- **Performance:** Métricas de velocidad y errores

---

## ✅ VENTAJAS DE ESTA IMPLEMENTACIÓN

### 1. **Triple Sistema de Analytics**
- **Interno:** Datos específicos del negocio
- **GA4:** Análisis de audiencia y marketing
- **Clarity:** Optimización de UX

### 2. **Geolocalización Automática**
- **Headers de Vercel** proporcionan país/ciudad sin configuración
- **Sin cookies** ni APIs externas necesarias

### 3. **Filtrado Inteligente**
- **Excluye admins/creators** automáticamente
- **Datos 100% limpios** de usuarios reales

### 4. **Performance Optimizada**
- **Fire and forget** - analytics no bloquean UX
- **Índices en BD** para consultas rápidas
- **Carga condicional** de scripts

### 5. **Privacy-First**
- **Visitor ID anónimo** hasta login
- **No PII** en analytics externos
- **Control total** de datos internos

---

## 🚨 CONSIDERACIONES IMPORTANTES

### 1. **Vercel Headers**
- **Solo funcionan en producción** (no en localhost)
- **Geolocalización automática** sin configuración extra
- **Precisión alta** para países, media para ciudades

### 2. **Filtrado de Roles**
- **Requiere sistema de autenticación** con roles
- **Se basa en localStorage** para persistencia
- **Funciona después del login** (no antes)

### 3. **Performance**
- **Scripts se cargan dinámicamente** solo para usuarios reales
- **Analytics nunca rompen** la experiencia de usuario
- **Errores se silencian** automáticamente

### 4. **Escalabilidad**
- **Tabla visitor_analytics** puede crecer mucho
- **Considerar particionado** por fecha en el futuro
- **Agregaciones pre-calculadas** para dashboards rápidos

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### Para Shugu Travel Platform:

1. **Adaptar Eventos:**
   - `search_shuttle`, `view_shuttle_detail`
   - `book_shuttle`, `complete_booking`
   - `search_tour`, `view_accommodation`

2. **Métricas Específicas:**
   - **Rutas más buscadas**
   - **Conversión por tipo de transporte**
   - **Ciudades de origen/destino populares**

3. **Geolocalización Avanzada:**
   - **Mapas de calor** de búsquedas por región
   - **Análisis de rutas** más demandadas
   - **Estacionalidad** por destino

4. **Integración con Negocio:**
   - **ROI por canal** de marketing
   - **Análisis de precios** vs demanda
   - **Optimización de inventario** por ruta

---

**¡Con esta implementación tendrás un sistema de analytics profesional y completo!** 🚀

Los datos de geolocalización automática de Vercel + el filtrado inteligente de admins + el triple sistema de tracking te darán insights muy valiosos para hacer crecer el negocio.