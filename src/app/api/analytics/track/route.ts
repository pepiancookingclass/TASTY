import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar service role para insertar analytics (bypasa RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mapa de códigos de país a nombres
const COUNTRY_NAMES: Record<string, string> = {
  'GT': 'Guatemala',
  'MX': 'México',
  'SV': 'El Salvador',
  'HN': 'Honduras',
  'NI': 'Nicaragua',
  'CR': 'Costa Rica',
  'PA': 'Panamá',
  'CO': 'Colombia',
  'US': 'Estados Unidos',
  'ES': 'España',
  'AR': 'Argentina',
  'CL': 'Chile',
  'PE': 'Perú',
  'EC': 'Ecuador',
  'VE': 'Venezuela',
  'BR': 'Brasil',
};

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua) && !/tablet/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getReferrerSource(referrer: string | null): string {
  if (!referrer) return 'direct';
  
  const ref = referrer.toLowerCase();
  if (ref.includes('google')) return 'google';
  if (ref.includes('facebook') || ref.includes('fb.com')) return 'facebook';
  if (ref.includes('instagram')) return 'instagram';
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'whatsapp';
  if (ref.includes('tiktok')) return 'tiktok';
  if (ref.includes('twitter') || ref.includes('x.com')) return 'twitter';
  if (ref.includes('linkedin')) return 'linkedin';
  if (ref.includes('youtube')) return 'youtube';
  
  return 'other';
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // ========================================
    // EXTRAER GEOLOCATION DE VERCEL HEADERS
    // ========================================
    const countryCode = request.headers.get('x-vercel-ip-country') || null;
    const city = request.headers.get('x-vercel-ip-city') || null;
    const region = request.headers.get('x-vercel-ip-country-region') || null;
    const countryName = countryCode ? COUNTRY_NAMES[countryCode] || countryCode : null;

    // ========================================
    // DETECTAR DISPOSITIVO
    // ========================================
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);
    const browserLanguage = request.headers.get('accept-language')?.split(',')[0] || null;

    // ========================================
    // DETECTAR REFERRER
    // ========================================
    const referrer = payload.referrer || request.headers.get('referer') || null;
    const referrerSource = getReferrerSource(referrer);

    // ========================================
    // GUARDAR EN SUPABASE
    // ========================================
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const analyticsData = {
      visitor_id: payload.visitor_id,
      user_id: payload.user_id || null,
      is_logged_in: !!payload.user_id,
      
      // Geolocalización
      country_code: countryCode,
      country_name: countryName,
      city: city,
      region: region,
      
      // Dispositivo
      device_type: deviceType,
      user_agent: userAgent.substring(0, 500), // Limitar tamaño
      browser_language: browserLanguage,
      
      // Evento
      event_type: payload.event_type,
      page_path: payload.page_path || null,
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id || null,
      entity_name: payload.entity_name || null,
      
      // Producto específico
      product_category: payload.product_category || null,
      product_price: payload.product_price || null,
      creator_id: payload.creator_id || null,
      creator_name: payload.creator_name || null,
      
      // Compra
      order_id: payload.order_id || null,
      order_total: payload.order_total || null,
      items_count: payload.items_count || null,
      
      // Tráfico
      referrer: referrer,
      referrer_source: referrerSource,
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
    };

    const { error } = await supabase
      .from('visitor_analytics')
      .insert([analyticsData]);

    if (error) {
      console.error('Analytics insert error:', error);
      // No fallar - analytics no debe afectar UX
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    // Siempre retornar 200 - analytics no debe fallar
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'analytics' });
}
