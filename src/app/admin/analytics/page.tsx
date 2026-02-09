'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Eye, 
  MousePointer,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Globe,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// Datos de ejemplo (en producción vendrían de Vercel Analytics API)
const samplePageViews = [
  { name: 'Inicio', views: 2847, unique: 1923 },
  { name: 'Productos', views: 1832, unique: 1245 },
  { name: 'Creadores', views: 1247, unique: 892 },
  { name: 'Checkout', views: 456, unique: 398 },
  { name: 'Perfil', views: 234, unique: 187 },
];

const sampleProductViews = [
  { name: 'Brownies Chocolate', views: 456, addToCart: 89, creator: 'María Dulces' },
  { name: 'Pizza Casera', views: 398, addToCart: 76, creator: 'Cocina Ana' },
  { name: 'Collar Artesanal', views: 287, addToCart: 34, creator: 'Manos Creativas' },
  { name: 'Cupcakes Vainilla', views: 234, addToCart: 45, creator: 'María Dulces' },
  { name: 'Empanadas', views: 198, addToCart: 67, creator: 'Cocina Ana' },
];

const sampleTrafficSources = [
  { name: 'Directo', value: 45, color: '#8884d8' },
  { name: 'WhatsApp', value: 28, color: '#82ca9d' },
  { name: 'Facebook', value: 15, color: '#ffc658' },
  { name: 'Instagram', value: 8, color: '#ff7c7c' },
  { name: 'Google', value: 4, color: '#8dd1e1' },
];

const sampleDeviceData = [
  { name: 'Móvil', value: 68, color: '#8884d8' },
  { name: 'Desktop', value: 24, color: '#82ca9d' },
  { name: 'Tablet', value: 8, color: '#ffc658' },
];

const sampleTimeData = [
  { hour: '00:00', visits: 12 },
  { hour: '02:00', visits: 8 },
  { hour: '04:00', visits: 5 },
  { hour: '06:00', visits: 15 },
  { hour: '08:00', visits: 45 },
  { hour: '10:00', visits: 78 },
  { hour: '12:00', visits: 95 },
  { hour: '14:00', visits: 87 },
  { hour: '16:00', visits: 92 },
  { hour: '18:00', visits: 105 },
  { hour: '20:00', visits: 89 },
  { hour: '22:00', visits: 56 },
];

const sampleWeeklyData = [
  { day: 'Lun', visits: 234, orders: 12, revenue: 1450 },
  { day: 'Mar', visits: 287, orders: 18, revenue: 2100 },
  { day: 'Mié', visits: 345, orders: 22, revenue: 2800 },
  { day: 'Jue', visits: 298, orders: 15, revenue: 1950 },
  { day: 'Vie', visits: 412, orders: 28, revenue: 3200 },
  { day: 'Sáb', visits: 567, orders: 35, revenue: 4100 },
  { day: 'Dom', visits: 445, orders: 25, revenue: 2900 },
];

export default function AdminAnalyticsPage() {
  const { canAccessAdminPanel, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const t = dict.admin.analytics;
  
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canAccessAdminPanel) {
      router.push('/');
    }
  }, [canAccessAdminPanel, permissionsLoading, router]);

  // Simular carga de datos
  const refreshData = async () => {
    setRefreshing(true);
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
    toast({
      title: t?.updatedTitle ?? "Datos actualizados",
      description: t?.updatedDesc ?? "Los analytics han sido actualizados exitosamente"
    });
  };

  if (permissionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          {t?.loading ?? "Cargando analytics..."}
        </div>
      </div>
    );
  }

  if (!canAccessAdminPanel) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            {t?.title ?? "Analytics Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {t?.subtitle ?? "Análisis completo del comportamiento de usuarios y rendimiento"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">{t?.ranges?.today ?? "Hoy"}</SelectItem>
              <SelectItem value="7d">{t?.ranges?.last7 ?? "7 días"}</SelectItem>
              <SelectItem value="30d">{t?.ranges?.last30 ?? "30 días"}</SelectItem>
              <SelectItem value="90d">{t?.ranges?.last90 ?? "90 días"}</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t?.refresh ?? "Actualizar"}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t?.export ?? "Exportar"}
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t?.cards?.uniqueVisitors ?? "Visitantes Únicos"}
                </p>
                <p className="text-3xl font-bold">3,247</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12.5% vs semana anterior
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t?.cards?.pageViews ?? "Páginas Vistas"}
                </p>
                <p className="text-3xl font-bold">8,916</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +8.2% vs semana anterior
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t?.cards?.conversionRate ?? "Tasa de Conversión"}
                </p>
                <p className="text-3xl font-bold">4.2%</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                  -2.1% vs semana anterior
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t?.cards?.avgTime ?? "Tiempo Promedio"}
                </p>
                <p className="text-3xl font-bold">3:24</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +15s vs semana anterior
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tráfico Semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Tráfico Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sampleWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuentes de Tráfico */}
        <Card>
          <CardHeader>
            <CardTitle>Fuentes de Tráfico</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sampleTrafficSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sampleTrafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Páginas Más Visitadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t?.topPagesTitle ?? "Páginas Más Visitadas"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samplePageViews.map((page, index) => (
                <div key={page.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.unique} {t?.topPagesUnique ?? "visitantes únicos"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {page.views.toLocaleString()} {t?.topPagesViews ?? "vistas"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Productos Más Vistos */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.topProductsTitle ?? "Productos Más Vistos"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleProductViews.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t?.topProductsBy ?? "por"} {product.creator}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {product.views} {t?.topProductsViews ?? "vistas"}
                    </p>
                    <p className="text-sm text-green-600">
                      {product.addToCart} {t?.topProductsAddToCart ?? "al carrito"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dispositivos y Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Dispositivos */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.devicesTitle ?? "Dispositivos"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleDeviceData.map((device) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {device.name === 'Móvil' && <Smartphone className="h-5 w-5 text-blue-600" />}
                    {device.name === 'Desktop' && <Monitor className="h-5 w-5 text-green-600" />}
                    {device.name === 'Tablet' && <Globe className="h-5 w-5 text-orange-600" />}
                    <span className="font-medium">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${device.value}%`, 
                          backgroundColor: device.color 
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12">{device.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horarios de Mayor Actividad */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.performanceTitle ?? "Actividad por Hora"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sampleTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Rendimiento Web</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0.8s</div>
          <div className="text-sm text-muted-foreground">{t?.perfFCP ?? "First Contentful Paint"}</div>
          <Badge variant="default" className="mt-2">{t?.perfBadges?.excellent ?? "Excelente"}</Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">1.2s</div>
          <div className="text-sm text-muted-foreground">{t?.perfLCP ?? "Largest Contentful Paint"}</div>
          <Badge variant="default" className="mt-2">{t?.perfBadges?.good ?? "Bueno"}</Badge>
            </div>
            <div className="text-3xl font-bold text-yellow-600 text-center">
              <div>2.1s</div>
          <div className="text-sm text-muted-foreground">{t?.perfFID ?? "First Input Delay"}</div>
          <Badge variant="secondary" className="mt-2">{t?.perfBadges?.needsImprovement ?? "Mejorable"}</Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0.05</div>
          <div className="text-sm text-muted-foreground">{t?.perfCLS ?? "Cumulative Layout Shift"}</div>
          <Badge variant="default" className="mt-2">{t?.perfBadges?.excellent ?? "Excelente"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




