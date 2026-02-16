import { supabase } from '@/lib/supabase';

// ============================================
// ANALYTICS DESDE BASE DE DATOS (Datos Reales)
// ============================================

// ✅ EXCLUIR admins y creadores de las estadísticas para evitar datos de prueba
async function getExcludedUserIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, roles')
    .or('roles.cs.["admin"],roles.cs.["creator"]');
  
  if (error || !data) {
    console.warn('No se pudieron obtener usuarios excluidos:', error);
    return [];
  }
  
  return data.map(u => u.id);
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  totalCreators: number;
  avgOrderValue: number;
  ordersThisWeek: number;
  revenueThisWeek: number;
  ordersLastWeek: number;
  revenueLastWeek: number;
}

export interface TopProduct {
  id: string;
  name: string;
  creator_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

export interface TopCreator {
  id: string;
  name: string;
  total_orders: number;
  total_revenue: number;
  product_count: number;
}

export interface OrdersByDay {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
}

export interface DeliveryStats {
  avg_delivery_fee: number;
  total_delivery_fees: number;
  avg_distance_km: number;
  orders_with_auto: number;
  orders_with_moto: number;
}

// Obtener estadísticas generales del dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // ✅ Obtener IDs de admins/creadores para excluirlos
  const excludedIds = await getExcludedUserIds();

  // Consultas en paralelo
  const [
    ordersResult,
    usersResult,
    productsResult,
    creatorsResult,
    ordersThisWeekResult,
    ordersLastWeekResult
  ] = await Promise.all([
    // Total órdenes y revenue (excluyendo admins/creadores)
    supabase
      .from('orders')
      .select('total, subtotal, delivery_fee, user_id')
      .neq('status', 'cancelled'),
    
    // Total usuarios (solo clientes reales)
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .not('roles', 'cs', '["admin"]')
      .not('roles', 'cs', '["creator"]'),
    
    // Total productos activos
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    
    // Total creadores
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .contains('roles', ['creator']),
    
    // Órdenes esta semana
    supabase
      .from('orders')
      .select('total, user_id')
      .neq('status', 'cancelled')
      .gte('created_at', startOfWeek.toISOString()),
    
    // Órdenes semana pasada
    supabase
      .from('orders')
      .select('total, user_id')
      .neq('status', 'cancelled')
      .gte('created_at', startOfLastWeek.toISOString())
      .lt('created_at', startOfWeek.toISOString())
  ]);
  
  // ✅ Filtrar órdenes de admins/creadores
  const filterExcluded = (orders: any[]) => 
    orders.filter(o => !excludedIds.includes(o.user_id));

  // ✅ Aplicar filtro a todas las órdenes
  const orders = filterExcluded(ordersResult.data || []);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersThisWeek = filterExcluded(ordersThisWeekResult.data || []);
  const ordersLastWeek = filterExcluded(ordersLastWeekResult.data || []);

  return {
    totalOrders,
    totalRevenue,
    totalUsers: usersResult.count || 0,
    totalProducts: productsResult.count || 0,
    totalCreators: creatorsResult.count || 0,
    avgOrderValue,
    ordersThisWeek: ordersThisWeek.length,
    revenueThisWeek: ordersThisWeek.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
    ordersLastWeek: ordersLastWeek.length,
    revenueLastWeek: ordersLastWeek.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
  };
}

// Obtener productos más vendidos (excluyendo órdenes de admins/creadores)
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  // ✅ Obtener IDs excluidos
  const excludedIds = await getExcludedUserIds();
  
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      product_id,
      quantity,
      unit_price,
      products!inner(id, name_es, creator_id),
      orders!inner(status, user_id)
    `)
    .neq('orders.status', 'cancelled');

  if (error || !data) {
    console.error('Error fetching top products:', error);
    return [];
  }

  // ✅ Filtrar items de órdenes de admins/creadores
  const filteredData = data.filter(item => {
    const order = item.orders as any;
    return !excludedIds.includes(order?.user_id);
  });

  // Agrupar por producto
  const productMap = new Map<string, TopProduct>();
  
  for (const item of filteredData) {
    const productId = item.product_id;
    const product = item.products as any;
    
    if (!productMap.has(productId)) {
      productMap.set(productId, {
        id: productId,
        name: product?.name_es || 'Producto',
        creator_name: '', // Se llenará después
        total_quantity: 0,
        total_revenue: 0,
        order_count: 0
      });
    }
    
    const entry = productMap.get(productId)!;
    entry.total_quantity += item.quantity;
    entry.total_revenue += item.quantity * (parseFloat(item.unit_price) || 0);
    entry.order_count += 1;
  }

  // Ordenar por cantidad y limitar
  return Array.from(productMap.values())
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit);
}

// Obtener órdenes por día (últimos N días) - excluyendo admins/creadores
export async function getOrdersByDay(days: number = 7): Promise<OrdersByDay[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // ✅ Obtener IDs excluidos
  const excludedIds = await getExcludedUserIds();

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total, user_id')
    .neq('status', 'cancelled')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching orders by day:', error);
    return [];
  }

  // ✅ Filtrar órdenes de admins/creadores
  const filteredData = data.filter(o => !excludedIds.includes(o.user_id));

  // Agrupar por día
  const dayMap = new Map<string, { orders: number; revenue: number }>();
  
  // Inicializar todos los días
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    dayMap.set(dateStr, { orders: 0, revenue: 0 });
  }

  // Llenar con datos reales
  for (const order of filteredData) {
    const dateStr = order.created_at.split('T')[0];
    const entry = dayMap.get(dateStr);
    if (entry) {
      entry.orders += 1;
      entry.revenue += parseFloat(order.total) || 0;
    }
  }

  return Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    orders: data.orders,
    revenue: data.revenue
  }));
}

// Obtener órdenes por estado (excluyendo admins/creadores)
export async function getOrdersByStatus(): Promise<OrdersByStatus[]> {
  // ✅ Obtener IDs excluidos
  const excludedIds = await getExcludedUserIds();

  const { data, error } = await supabase
    .from('orders')
    .select('status, user_id');

  if (error || !data) {
    console.error('Error fetching orders by status:', error);
    return [];
  }

  // ✅ Filtrar órdenes de admins/creadores
  const filteredData = data.filter(o => !excludedIds.includes(o.user_id));

  const statusMap = new Map<string, number>();
  for (const order of filteredData) {
    const status = order.status || 'unknown';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }

  return Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count
  }));
}

// Obtener estadísticas de delivery (excluyendo admins/creadores)
export async function getDeliveryStats(): Promise<DeliveryStats> {
  // ✅ Obtener IDs excluidos
  const excludedIds = await getExcludedUserIds();

  const { data, error } = await supabase
    .from('orders')
    .select('delivery_fee, delivery_breakdown, user_id')
    .neq('status', 'cancelled')
    .not('delivery_fee', 'is', null);

  if (error || !data) {
    console.error('Error fetching delivery stats:', error);
    return {
      avg_delivery_fee: 0,
      total_delivery_fees: 0,
      avg_distance_km: 0,
      orders_with_auto: 0,
      orders_with_moto: 0
    };
  }

  // ✅ Filtrar órdenes de admins/creadores
  const filteredData = data.filter(o => !excludedIds.includes(o.user_id));

  let totalFees = 0;
  let totalDistance = 0;
  let distanceCount = 0;
  let autoCount = 0;
  let motoCount = 0;

  for (const order of filteredData) {
    totalFees += parseFloat(order.delivery_fee) || 0;
    
    const breakdown = order.delivery_breakdown as any[];
    if (breakdown && Array.isArray(breakdown)) {
      for (const item of breakdown) {
        if (item.distance_km) {
          totalDistance += parseFloat(item.distance_km);
          distanceCount++;
        }
        if (item.vehicle === 'auto') autoCount++;
        if (item.vehicle === 'moto') motoCount++;
      }
    }
  }

  return {
    avg_delivery_fee: filteredData.length > 0 ? totalFees / filteredData.length : 0,
    total_delivery_fees: totalFees,
    avg_distance_km: distanceCount > 0 ? totalDistance / distanceCount : 0,
    orders_with_auto: autoCount,
    orders_with_moto: motoCount
  };
}

// Obtener órdenes recientes (excluyendo admins/creadores)
export async function getRecentOrders(limit: number = 10) {
  // ✅ Obtener IDs excluidos
  const excludedIds = await getExcludedUserIds();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      total,
      status,
      created_at,
      delivery_fee,
      user_id
    `)
    .order('created_at', { ascending: false })
    .limit(limit * 3); // Traer más para compensar los filtrados

  if (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }

  // ✅ Filtrar y limitar
  return (data || [])
    .filter(o => !excludedIds.includes(o.user_id))
    .slice(0, limit);
}

// ============================================
// VISITOR ANALYTICS (Datos de tráfico web)
// ============================================

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  productViews: number;
  addToCartCount: number;
  purchaseCount: number;
  conversionRate: number;
}

export interface VisitorsByCountry {
  country_code: string;
  country_name: string;
  visits: number;
}

export interface VisitorsByDevice {
  device_type: string;
  count: number;
  percentage: number;
}

export interface VisitsByDay {
  date: string;
  visits: number;
  unique_visitors: number;
}

export interface TopPage {
  page_path: string;
  views: number;
}

export interface ReferrerSource {
  source: string;
  count: number;
  percentage: number;
}

// Obtener estadísticas de visitantes
export async function getVisitorStats(days: number = 7): Promise<VisitorStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('event_type, visitor_id')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    console.error('Error fetching visitor stats:', error);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      pageViews: 0,
      productViews: 0,
      addToCartCount: 0,
      purchaseCount: 0,
      conversionRate: 0
    };
  }

  const uniqueVisitors = new Set(data.map(d => d.visitor_id)).size;
  const pageViews = data.filter(d => d.event_type === 'page_view').length;
  const productViews = data.filter(d => d.event_type === 'product_view').length;
  const addToCartCount = data.filter(d => d.event_type === 'add_to_cart').length;
  const purchaseCount = data.filter(d => d.event_type === 'purchase').length;

  return {
    totalVisits: data.length,
    uniqueVisitors,
    pageViews,
    productViews,
    addToCartCount,
    purchaseCount,
    conversionRate: uniqueVisitors > 0 ? (purchaseCount / uniqueVisitors) * 100 : 0
  };
}

// Obtener visitantes por país
export async function getVisitorsByCountry(days: number = 7, limit: number = 10): Promise<VisitorsByCountry[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('country_code, country_name')
    .gte('created_at', startDate.toISOString())
    .not('country_code', 'is', null);

  if (error || !data) {
    console.error('Error fetching visitors by country:', error);
    return [];
  }

  // Agrupar por país
  const countryMap = new Map<string, { country_name: string; visits: number }>();
  
  for (const row of data) {
    const key = row.country_code;
    if (!countryMap.has(key)) {
      countryMap.set(key, { country_name: row.country_name || row.country_code, visits: 0 });
    }
    countryMap.get(key)!.visits++;
  }

  return Array.from(countryMap.entries())
    .map(([country_code, data]) => ({
      country_code,
      country_name: data.country_name,
      visits: data.visits
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
}

// Obtener visitantes por dispositivo
export async function getVisitorsByDevice(days: number = 7): Promise<VisitorsByDevice[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('device_type')
    .gte('created_at', startDate.toISOString())
    .not('device_type', 'is', null);

  if (error || !data) {
    console.error('Error fetching visitors by device:', error);
    return [];
  }

  // Agrupar por dispositivo
  const deviceMap = new Map<string, number>();
  for (const row of data) {
    const device = row.device_type || 'unknown';
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
  }

  const total = data.length;

  return Array.from(deviceMap.entries())
    .map(([device_type, count]) => ({
      device_type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
}

// Obtener visitas por día
export async function getVisitsByDay(days: number = 7): Promise<VisitsByDay[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('created_at, visitor_id')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching visits by day:', error);
    return [];
  }

  // Inicializar todos los días
  const dayMap = new Map<string, { visits: number; visitors: Set<string> }>();
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    dayMap.set(dateStr, { visits: 0, visitors: new Set() });
  }

  // Llenar con datos
  for (const row of data) {
    const dateStr = row.created_at.split('T')[0];
    const entry = dayMap.get(dateStr);
    if (entry) {
      entry.visits++;
      entry.visitors.add(row.visitor_id);
    }
  }

  return Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    visits: data.visits,
    unique_visitors: data.visitors.size
  }));
}

// Obtener páginas más visitadas
export async function getTopPages(days: number = 7, limit: number = 10): Promise<TopPage[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('page_path')
    .eq('event_type', 'page_view')
    .gte('created_at', startDate.toISOString())
    .not('page_path', 'is', null);

  if (error || !data) {
    console.error('Error fetching top pages:', error);
    return [];
  }

  // Agrupar por página
  const pageMap = new Map<string, number>();
  for (const row of data) {
    const path = row.page_path || '/';
    pageMap.set(path, (pageMap.get(path) || 0) + 1);
  }

  return Array.from(pageMap.entries())
    .map(([page_path, views]) => ({ page_path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// Obtener fuentes de tráfico
export async function getReferrerSources(days: number = 7): Promise<ReferrerSource[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select('referrer_source')
    .gte('created_at', startDate.toISOString())
    .not('referrer_source', 'is', null);

  if (error || !data) {
    console.error('Error fetching referrer sources:', error);
    return [];
  }

  // Agrupar por fuente
  const sourceMap = new Map<string, number>();
  for (const row of data) {
    const source = row.referrer_source || 'direct';
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
  }

  const total = data.length;

  return Array.from(sourceMap.entries())
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
}

// Obtener creadores con más ventas (excluyendo órdenes de admins/creadores)
export async function getTopCreators(limit: number = 5): Promise<TopCreator[]> {
  // ✅ Obtener IDs excluidos
  const excludedIds = await getExcludedUserIds();

  // Primero obtener order_items con productos
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select(`
      quantity,
      unit_price,
      products!inner(creator_id),
      orders!inner(status, user_id)
    `)
    .neq('orders.status', 'cancelled');

  if (error || !orderItems) {
    console.error('Error fetching top creators:', error);
    return [];
  }

  // ✅ Filtrar items de órdenes de admins/creadores
  const filteredItems = orderItems.filter(item => {
    const order = item.orders as any;
    return !excludedIds.includes(order?.user_id);
  });

  // Agrupar por creador
  const creatorMap = new Map<string, { revenue: number; orders: Set<string> }>();
  
  for (const item of filteredItems) {
    const product = item.products as any;
    const creatorId = product?.creator_id;
    if (!creatorId) continue;
    
    if (!creatorMap.has(creatorId)) {
      creatorMap.set(creatorId, { revenue: 0, orders: new Set() });
    }
    
    const entry = creatorMap.get(creatorId)!;
    entry.revenue += item.quantity * (parseFloat(item.unit_price) || 0);
  }

  // Obtener nombres de creadores
  const creatorIds = Array.from(creatorMap.keys());
  const { data: creators } = await supabase
    .from('users')
    .select('id, name')
    .in('id', creatorIds);

  const creatorNames = new Map(creators?.map(c => [c.id, c.name]) || []);

  // Obtener conteo de productos por creador
  const { data: products } = await supabase
    .from('products')
    .select('creator_id')
    .in('creator_id', creatorIds);

  const productCounts = new Map<string, number>();
  for (const p of products || []) {
    productCounts.set(p.creator_id, (productCounts.get(p.creator_id) || 0) + 1);
  }

  return Array.from(creatorMap.entries())
    .map(([id, data]) => ({
      id,
      name: creatorNames.get(id) || 'Creador',
      total_orders: data.orders.size,
      total_revenue: data.revenue,
      product_count: productCounts.get(id) || 0
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}
