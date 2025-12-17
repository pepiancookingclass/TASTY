'use client';
import { Order, Product } from '@/lib/types';
import { products } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OrderTable } from '@/components/chef/orders/OrderTable';

// Mock Data for demonstration
const sampleOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Alice Johnson',
    orderDate: new Date('2024-07-28T14:30:00Z'),
    deliveryDate: new Date('2024-07-29T14:30:00Z'),
    items: [
      { product: products.find(p => p.id === 'prod-001')!, quantity: 2 },
      { product: products.find(p => p.id === 'prod-002')!, quantity: 1 },
    ],
    status: 'En Preparación',
    total: 11.50,
  },
  {
    id: 'ORD-002',
    customerName: 'Bob Williams',
    orderDate: new Date('2024-07-28T12:05:00Z'),
    deliveryDate: new Date('2024-07-28T18:05:00Z'),
    items: [
      { product: products.find(p => p.id === 'prod-006')!, quantity: 1 },
    ],
    status: 'Listo para Recoger',
    total: 7.50,
  },
  {
    id: 'ORD-003',
    customerName: 'Charlie Brown',
    orderDate: new Date('2024-07-27T18:00:00Z'),
    deliveryDate: new Date('2024-07-28T12:00:00Z'),
    items: [
      { product: products.find(p => p.id === 'prod-003')!, quantity: 1 },
      { product: products.find(p => p.id === 'prod-005')!, quantity: 2 },
    ],
    status: 'Entregado',
    total: 18.00,
  },
    {
    id: 'ORD-004',
    customerName: 'Diana Prince',
    orderDate: new Date('2024-07-28T16:00:00Z'),
    deliveryDate: new Date('2024-07-28T20:00:00Z'),
    items: [
      { product: products.find(p => p.id === 'prod-004')!, quantity: 1 },
    ],
    status: 'Nuevo',
    total: 12.00,
  },
];


export default function ChefOrdersPage() {
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
                <OrderTable orders={sampleOrders} />
            </CardContent>
        </Card>
    </div>
  );
}
