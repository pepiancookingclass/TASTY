'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, PackageCheck, Percent } from 'lucide-react';
import { RevenueChart } from '@/components/creator/RevenueChart';
import { OrderStatusStats } from '@/components/creator/OrderStatusStats';
import { useOrders } from '@/hooks/useOrders';
import { useDictionary } from '@/hooks/useDictionary';

export default function CreatorDashboardPage() {
  const { orders } = useOrders();
  const dict = useDictionary();

  const totalOrderValue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const stats = {
    totalRevenue: totalOrderValue * 0.9, // El creador recibe 90%
    totalOrderValue: totalOrderValue, // Valor total de pedidos
    activeOrders: orders.filter(o => o.status === 'preparing' || o.status === 'new').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    tastyCommission: totalOrderValue * 0.1, // Tasty se queda con 10%
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

  return (
    <div>
      <h1 className="font-headline text-4xl font-bold mb-8">{dict.creatorSidebar.dashboard}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.creatorDashboard.totalRevenue.title}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Tus ganancias (90% de {formatCurrency(stats.totalOrderValue)})</p>
            <p className="text-xs text-red-500">Comisión Tasty: {formatCurrency(stats.tastyCommission)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.creatorDashboard.activeOrders.title}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">{dict.creatorDashboard.activeOrders.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.creatorDashboard.completedOrders.title}</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">{dict.creatorDashboard.completedOrders.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.creatorDashboard.commission.title}</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.tastyCommission)}</div>
            <p className="text-xs text-muted-foreground">{dict.creatorDashboard.commission.description}</p>
          </CardContent>
        </Card>
      </div>

      <OrderStatusStats />

      <Card>
        <CardHeader>
          <CardTitle>{dict.creatorDashboard.revenueOverview}</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <RevenueChart />
        </CardContent>
      </Card>
    </div>
  );
}
