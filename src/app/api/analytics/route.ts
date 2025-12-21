import { NextRequest, NextResponse } from 'next/server';

// Esta API simula datos de analytics
// En producción, aquí harías llamadas a la API de Vercel Analytics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || '7d';
  const metric = searchParams.get('metric') || 'all';

  // Simular datos basados en el rango de tiempo
  const multiplier = timeRange === '1d' ? 0.1 : timeRange === '7d' ? 1 : timeRange === '30d' ? 4 : 12;

  const mockData = {
    overview: {
      uniqueVisitors: Math.floor(3247 * multiplier),
      pageViews: Math.floor(8916 * multiplier),
      conversionRate: 4.2,
      avgSessionTime: '3:24',
      bounceRate: 32.5
    },
    
    topPages: [
      { path: '/', views: Math.floor(2847 * multiplier), unique: Math.floor(1923 * multiplier) },
      { path: '/products', views: Math.floor(1832 * multiplier), unique: Math.floor(1245 * multiplier) },
      { path: '/creators', views: Math.floor(1247 * multiplier), unique: Math.floor(892 * multiplier) },
      { path: '/checkout', views: Math.floor(456 * multiplier), unique: Math.floor(398 * multiplier) },
      { path: '/user/profile', views: Math.floor(234 * multiplier), unique: Math.floor(187 * multiplier) },
    ],

    topProducts: [
      { 
        id: '1', 
        name: 'Brownies Chocolate', 
        views: Math.floor(456 * multiplier), 
        addToCart: Math.floor(89 * multiplier),
        creator: 'María Dulces',
        conversionRate: 19.5
      },
      { 
        id: '2', 
        name: 'Pizza Casera', 
        views: Math.floor(398 * multiplier), 
        addToCart: Math.floor(76 * multiplier),
        creator: 'Cocina Ana',
        conversionRate: 19.1
      },
      { 
        id: '3', 
        name: 'Collar Artesanal', 
        views: Math.floor(287 * multiplier), 
        addToCart: Math.floor(34 * multiplier),
        creator: 'Manos Creativas',
        conversionRate: 11.8
      },
    ],

    trafficSources: [
      { source: 'Direct', visitors: Math.floor(1461 * multiplier), percentage: 45 },
      { source: 'WhatsApp', visitors: Math.floor(909 * multiplier), percentage: 28 },
      { source: 'Facebook', visitors: Math.floor(487 * multiplier), percentage: 15 },
      { source: 'Instagram', visitors: Math.floor(260 * multiplier), percentage: 8 },
      { source: 'Google', visitors: Math.floor(130 * multiplier), percentage: 4 },
    ],

    devices: [
      { device: 'Mobile', percentage: 68, visitors: Math.floor(2208 * multiplier) },
      { device: 'Desktop', percentage: 24, visitors: Math.floor(779 * multiplier) },
      { device: 'Tablet', percentage: 8, visitors: Math.floor(260 * multiplier) },
    ],

    countries: [
      { country: 'Guatemala', visitors: Math.floor(2847 * multiplier), percentage: 87.7 },
      { country: 'El Salvador', visitors: Math.floor(195 * multiplier), percentage: 6.0 },
      { country: 'Honduras', visitors: Math.floor(130 * multiplier), percentage: 4.0 },
      { country: 'México', visitors: Math.floor(65 * multiplier), percentage: 2.0 },
      { country: 'Otros', visitors: Math.floor(10 * multiplier), percentage: 0.3 },
    ],

    hourlyData: Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      visits: Math.floor((50 + Math.sin((hour - 6) * Math.PI / 12) * 40 + Math.random() * 20) * multiplier / 7)
    })),

    weeklyData: [
      { day: 'Lun', visits: Math.floor(234 * multiplier), orders: Math.floor(12 * multiplier), revenue: 1450 * multiplier },
      { day: 'Mar', visits: Math.floor(287 * multiplier), orders: Math.floor(18 * multiplier), revenue: 2100 * multiplier },
      { day: 'Mié', visits: Math.floor(345 * multiplier), orders: Math.floor(22 * multiplier), revenue: 2800 * multiplier },
      { day: 'Jue', visits: Math.floor(298 * multiplier), orders: Math.floor(15 * multiplier), revenue: 1950 * multiplier },
      { day: 'Vie', visits: Math.floor(412 * multiplier), orders: Math.floor(28 * multiplier), revenue: 3200 * multiplier },
      { day: 'Sáb', visits: Math.floor(567 * multiplier), orders: Math.floor(35 * multiplier), revenue: 4100 * multiplier },
      { day: 'Dom', visits: Math.floor(445 * multiplier), orders: Math.floor(25 * multiplier), revenue: 2900 * multiplier },
    ],

    events: [
      { event: 'product_view', count: Math.floor(5234 * multiplier) },
      { event: 'add_to_cart', count: Math.floor(892 * multiplier) },
      { event: 'begin_checkout', count: Math.floor(456 * multiplier) },
      { event: 'purchase', count: Math.floor(234 * multiplier) },
      { event: 'creator_view', count: Math.floor(1247 * multiplier) },
      { event: 'search', count: Math.floor(678 * multiplier) },
    ],

    performance: {
      fcp: 0.8, // First Contentful Paint
      lcp: 1.2, // Largest Contentful Paint  
      fid: 2.1, // First Input Delay
      cls: 0.05, // Cumulative Layout Shift
      ttfb: 0.3, // Time to First Byte
      speedIndex: 1.4
    }
  };

  // Filtrar por métrica específica si se solicita
  if (metric !== 'all' && mockData[metric as keyof typeof mockData]) {
    return NextResponse.json({
      timeRange,
      metric,
      data: mockData[metric as keyof typeof mockData]
    });
  }

  return NextResponse.json({
    timeRange,
    data: mockData
  });
}

// Endpoint para eventos personalizados
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event, properties } = body;

  // En producción, aquí enviarías el evento a tu sistema de analytics
  console.log('Analytics Event:', { event, properties, timestamp: new Date().toISOString() });

  return NextResponse.json({ 
    success: true, 
    message: 'Event tracked successfully',
    event,
    properties 
  });
}
