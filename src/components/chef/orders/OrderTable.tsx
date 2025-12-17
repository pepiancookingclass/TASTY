'use client';

import { Order } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusSelector } from './OrderStatusSelector';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const { language } = useLanguage();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (date: Date) => {
      return format(date, "MMM d, yyyy 'at' h:mm a");
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="hidden md:table-cell">Delivery Date</TableHead>
           <TableHead className="hidden lg:table-cell">Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground font-semibold">{formatDate(order.deliveryDate)}</TableCell>
            <TableCell className="hidden lg:table-cell">
                <ul className="text-sm text-muted-foreground">
                    {order.items.map(item => (
                        <li key={item.product.id}>
                            {item.quantity}x {item.product.name[language]}
                        </li>
                    ))}
                </ul>
            </TableCell>
            <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
            <TableCell className="text-center">
              <OrderStatusSelector orderId={order.id} currentStatus={order.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
