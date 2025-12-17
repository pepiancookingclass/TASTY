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
import { useDictionary } from '@/hooks/useDictionary';

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const { language } = useLanguage();
  const dict = useDictionary();
  
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
          <TableHead>{dict.orderTable.orderId}</TableHead>
          <TableHead className="hidden sm:table-cell">{dict.orderTable.customer}</TableHead>
          <TableHead className="hidden lg:table-cell">{dict.orderTable.dates}</TableHead>
          <TableHead className="text-right">{dict.orderTable.total}</TableHead>
          <TableHead className="text-center">{dict.orderTable.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <div className="font-medium">{order.id}</div>
              <div className="text-sm text-muted-foreground sm:hidden">{order.customerName}</div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{order.customerName}</TableCell>
            <TableCell className="hidden lg:table-cell">
              <div>
                <span className="font-medium">{dict.orderTable.ordered}:</span> <span className="text-muted-foreground">{formatDate(order.orderDate)}</span>
              </div>
              <div>
              <span className="font-medium">{dict.orderTable.delivery}:</span> <span className="text-muted-foreground">{formatDate(order.deliveryDate)}</span>
              </div>
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
