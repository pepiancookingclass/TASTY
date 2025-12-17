'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OrderTable } from '@/components/creator/orders/OrderTable';
import { useOrders } from '@/hooks/useOrders';
import { useDictionary } from '@/hooks/useDictionary';

export default function CreatorOrdersPage() {
  const { orders } = useOrders();
  const dict = useDictionary();

  return (
    <div>
        <div className="mb-8">
            <h1 className="font-headline text-4xl font-bold">{dict.creatorOrders.title}</h1>
            <p className="text-muted-foreground mt-2">{dict.creatorOrders.description}</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>{dict.creatorOrders.allOrdersTitle}</CardTitle>
                <CardDescription>{dict.creatorOrders.allOrdersDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <OrderTable orders={orders} />
            </CardContent>
        </Card>
    </div>
  );
}
