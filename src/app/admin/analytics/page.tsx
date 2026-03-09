'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  ShoppingBag, 
  Eye, 
  DollarSign,
  Package,
  Truck,
  Clock,
  Smartphone,
  Monitor,
  RefreshCw,
  Loader2,
  ChefHat
} from 'lucide-react';
import { AnimatedSwan } from '@/components/AnimatedSwan';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  getDashboardStats,
  getTopProducts,
  getOrdersByDay,
  getOrdersByStatus,
  getDeliveryStats,
  getRecentOrders,
  getVisitorStats,
  getVisitorsByCountry,
  getVisitorsByDevice,
  getVisitsByDay,
  getTopPages,
  getReferrerSources,
  type DashboardStats,
  type TopProduct,
  type OrdersByDay,
  type OrdersByStatus,
  type DeliveryStats,
  type VisitorStats,
  type VisitorsByCountry,
  type VisitorsByDevice,
  type VisitsByDay,
  type TopPage,
  type ReferrerSource
} from '@/lib/services/analytics';

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  preparing: '#f59e0b',
  ready: '#8b5cf6',
  out_for_delivery: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444'
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  preparing: 'Preparando',
  ready: 'Listo',
  out_for_delivery: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

export default function AdminAnalyticsPage() {
  const { canAccessAdminPanel, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const t = dict?.admin?.analytics;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  
  // Estados para datos reales
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [ordersByDay, setOrdersByDay] = useState<OrdersByDay[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  // Estados para visitor analytics
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [visitorsByCountry, setVisitorsByCountry] = useState<VisitorsByCountry[]>([]);
  const [visitorsByDevice, setVisitorsByDevice] = useState<VisitorsByDevice[]>([]);
  const [visitsByDay, setVisitsByDay] = useState<VisitsByDay[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [referrerSources, setReferrerSources] = useState<ReferrerSource[]>([]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' });
  };

  // Cargar datos
  const loadData = async () => {
    try {
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      const [
        statsData,
        topProductsData,
        ordersByDayData,
        ordersByStatusData,
        deliveryStatsData,
        recentOrdersData,
        // Visitor analytics
        visitorStatsData,
        visitorsByCountryData,
        visitorsByDeviceData,
        visitsByDayData,
        topPagesData,
        referrerSourcesData
      ] = await Promise.all([
        getDashboardStats(),
        getTopProducts(5),
        getOrdersByDay(days),
        getOrdersByStatus(),
        getDeliveryStats(),
        getRecentOrders(5),
        // Visitor analytics
        getVisitorStats(days),
        getVisitorsByCountry(days, 10),
        getVisitorsByDevice(days),
        getVisitsByDay(days),
        getTopPages(days, 10),
        getReferrerSources(days)
      ]);

      setStats(statsData);
      setTopProducts(topProductsData);
      setOrdersByDay(ordersByDayData);
      setOrdersByStatus(ordersByStatusData);
      setDeliveryStats(deliveryStatsData);
      setRecentOrders(recentOrdersData);
      
      // Set visitor analytics
      setVisitorStats(visitorStatsData);
      setVisitorsByCountry(visitorsByCountryData);
      setVisitorsByDevice(visitorsByDeviceData);
      setVisitsByDay(visitsByDayData);
      setTopPages(topPagesData);
      setReferrerSources(referrerSourcesData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canAccessAdminPanel) {
      router.push('/');
    }
  }, [canAccessAdminPanel, permissionsLoading, router]);

  // Cargar datos iniciales
  useEffect(() => {
    if (canAccessAdminPanel) {
      loadData();
    }
  }, [canAccessAdminPanel, timeRange]);

  // Refrescar datos
  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Datos actualizados",
      description: "Los analytics han sido actualizados exitosamente"
    });
  };

  // Calcular cambio porcentual
  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (permissionsLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AnimatedSwan size={64} />
          <p className="text-sm text-muted-foreground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdminPanel) {
    return null;
  }

  const ordersChange = stats ? getPercentChange(stats.ordersThisWeek, stats.ordersLastWeek) : 0;
  const revenueChange = stats ? getPercentChange(stats.revenueThisWeek, stats.revenueLastWeek) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Datos en tiempo real de tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28 sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Hoy</SelectItem>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            className="sm:size-default"
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Órdenes</p>
                <p className="text-3xl font-bold">{stats?.totalOrders || 0}</p>
                <p className={`text-sm flex items-center mt-1 ${ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ordersChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {ordersChange >= 0 ? '+' : ''}{ordersChange.toFixed(1)}% vs semana anterior
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                <p className="text-3xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p>
                <p className={`text-sm flex items-center mt-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs semana anterior
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Registrados</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats?.totalCreators || 0} creadores activos
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
                <p className="text-3xl font-bold">{formatPrice(stats?.avgOrderValue || 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats?.totalProducts || 0} productos activos
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Tráfico Web */}
      <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Eye className="h-5 w-5" />
            Tráfico Web (Visitantes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visitorStats && visitorStats.totalVisits > 0 ? (
            <>
              {/* KPIs de visitantes */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <div className="text-center p-3 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-purple-600">{visitorStats.totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Total Visitas</p>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">{visitorStats.uniqueVisitors}</p>
                  <p className="text-xs text-muted-foreground">Visitantes Únicos</p>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-indigo-600">{visitorStats.pageViews}</p>
                  <p className="text-xs text-muted-foreground">Páginas Vistas</p>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-pink-600">{visitorStats.productViews}</p>
                  <p className="text-xs text-muted-foreground">Productos Vistos</p>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-orange-600">{visitorStats.addToCartCount}</p>
                  <p className="text-xs text-muted-foreground">Add to Cart</p>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-600">{visitorStats.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Conversión</p>
                </div>
              </div>

              {/* Gráficos de visitantes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Visitas por día */}
                <div className="lg:col-span-2 bg-white/80 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">Visitas por Día</h4>
                  {visitsByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={visitsByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={formatDate} fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('es-GT')}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="visits" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.3}
                          name="Visitas"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="unique_visitors" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.2}
                          name="Únicos"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      Sin datos aún
                    </div>
                  )}
                </div>

                {/* Dispositivos */}
                <div className="bg-white/80 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Dispositivos
                  </h4>
                  {visitorsByDevice.length > 0 ? (
                    <div className="space-y-2">
                      {visitorsByDevice.map(d => (
                        <div key={d.device_type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {d.device_type === 'mobile' && <Smartphone className="h-4 w-4 text-blue-500" />}
                            {d.device_type === 'desktop' && <Monitor className="h-4 w-4 text-gray-500" />}
                            {d.device_type === 'tablet' && <Monitor className="h-4 w-4 text-purple-500" />}
                            <span className="text-sm capitalize">{d.device_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${d.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {d.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  )}
                </div>
              </div>

              {/* Segunda fila: Países, Fuentes, Páginas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Países */}
                <div className="bg-white/80 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">Top Países</h4>
                  {visitorsByCountry.length > 0 ? (
                    <div className="space-y-2">
                      {visitorsByCountry.slice(0, 5).map(c => (
                        <div key={c.country_code} className="flex items-center justify-between text-sm">
                          <span>{c.country_name}</span>
                          <Badge variant="secondary">{c.visits}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos de países</p>
                  )}
                </div>

                {/* Fuentes de tráfico */}
                <div className="bg-white/80 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">Fuentes de Tráfico</h4>
                  {referrerSources.length > 0 ? (
                    <div className="space-y-2">
                      {referrerSources.slice(0, 5).map(s => (
                        <div key={s.source} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{s.source}</span>
                          <Badge variant="outline">{s.count}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos de referrers</p>
                  )}
                </div>

                {/* Páginas más visitadas */}
                <div className="bg-white/80 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">Páginas Populares</h4>
                  {topPages.length > 0 ? (
                    <div className="space-y-2">
                      {topPages.slice(0, 5).map(p => (
                        <div key={p.page_path} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[150px]">{p.page_path}</span>
                          <Badge variant="secondary">{p.views}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos de páginas</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-purple-300 mx-auto mb-3" />
              <p className="text-purple-700 font-medium">Sin datos de visitantes aún</p>
              <p className="text-sm text-purple-600 mt-1">
                Los datos comenzarán a aparecer después del deploy cuando usuarios visiten el sitio.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Órdenes por Día */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes por Día</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-GT')}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatPrice(value) : value,
                      name === 'revenue' ? 'Ingresos' : 'Órdenes'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                    name="orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de Órdenes */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus.map(s => ({
                      ...s,
                      name: STATUS_LABELS[s.status] || s.status,
                      color: STATUS_COLORS[s.status] || '#888'
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.status] || '#888'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos y Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.order_count} órdenes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{product.total_quantity} vendidos</p>
                      <p className="text-sm text-green-600">{formatPrice(product.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de productos vendidos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas de Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Estadísticas de Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryStats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(deliveryStats.avg_delivery_fee)}
                    </p>
                    <p className="text-sm text-muted-foreground">Fee Promedio</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {deliveryStats.avg_distance_km.toFixed(1)} km
                    </p>
                    <p className="text-sm text-muted-foreground">Distancia Promedio</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏍️</span>
                      <span>Entregas en Moto</span>
                    </div>
                    <Badge variant="secondary">{deliveryStats.orders_with_moto}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚗</span>
                      <span>Entregas en Auto</span>
                    </div>
                    <Badge variant="secondary">{deliveryStats.orders_with_auto}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-medium">Total Fees Cobrados</span>
                    <span className="font-bold text-green-600">
                      {formatPrice(deliveryStats.total_delivery_fees)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de delivery
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Órdenes Recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Órdenes Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('es-GT', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      style={{ 
                        backgroundColor: STATUS_COLORS[order.status] || '#888',
                        color: 'white'
                      }}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                    <span className="font-bold">{formatPrice(parseFloat(order.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay órdenes recientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nota sobre Analytics externos */}
      <Card className="mt-8 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Eye className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900">Sistema de Analytics Completo Activo</h3>
              <p className="text-sm text-green-700 mt-2">
                <strong>Tracking interno (arriba):</strong> Datos de visitantes, dispositivos, países 
                y conversión almacenados en tu base de datos. Funciona inmediatamente después del deploy.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a 
                  href="https://vercel.com/pepiancookingclass-projects/tasty-lat/analytics" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
                >
                  📊 Vercel Analytics
                </a>
                <a 
                  href="https://analytics.google.com/analytics/web/#/p524916670/reports/reportinghub" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
                >
                  📈 Google Analytics 4
                </a>
                <a 
                  href="https://clarity.microsoft.com/projects/view/vicdzd41fb/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-full hover:bg-purple-700 transition-colors"
                >
                  🔥 Microsoft Clarity
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
