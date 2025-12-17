'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OrderTable } from '@/components/chef/orders/OrderTable';
import { useOrders } from '@/hooks/useOrders';

export default function ChefOrdersPage() {
  const { orders } = useOrders();

  return (
    <div>
        <div className="mb-8">
            <h1 className="font-headline text-4xl font-bold">Manage Orders</h1>
            <p className="text-muted-foreground mt-2">Track and update the status of your customer orders.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>A list of all incoming and past orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <OrderTable orders={orders} />
            </CardContent>
        </Card>
    </div>
  );
}
