'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, PackageCheck, Percent } from 'lucide-react';
import { RevenueChart } from '@/components/chef/RevenueChart';
import { useOrders } from '@/hooks/useOrders';
import { useDictionary } from '@/hooks/useDictionary';

export default function ChefDashboardPage() {
  const { orders } = useOrders();
  const dict = useDictionary();

  const stats = {
    totalRevenue: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0),
    activeOrders: orders.filter(o => o.status === 'preparing' || o.status === 'new').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    tastyCommission: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0) * 0.1,
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div>
      <h1 className="font-headline text-4xl font-bold mb-8">{dict.chefSidebar.dashboard}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.chefDashboard.totalRevenue.title}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{dict.chefDashboard.totalRevenue.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.chefDashboard.activeOrders.title}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">{dict.chefDashboard.activeOrders.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.chefDashboard.completedOrders.title}</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">{dict.chefDashboard.completedOrders.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.chefDashboard.commission.title}</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.tastyCommission)}</div>
            <p className="text-xs text-muted-foreground">{dict.chefDashboard.commission.description}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.chefDashboard.revenueOverview}</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <RevenueChart />
        </CardContent>
      </Card>
    </div>
  );
}
