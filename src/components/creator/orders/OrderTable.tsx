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
import { OrderStatusHistory } from './OrderStatusHistory';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { useDictionary } from '@/hooks/useDictionary';

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const { language } = useLanguage();
  const dict = useDictionary();
  const dateLocale = language === 'es' ? esLocale : enUS;
  const dateFormat = language === 'es' ? "d 'de' MMM yyyy 'a las' h:mm a" : "MMM d, yyyy 'at' h:mm a";
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(price);
  };

  const formatDate = (date: Date) => {
      return format(date, dateFormat, { locale: dateLocale });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{dict.orderTable.orderId}</TableHead>
          <TableHead className="hidden sm:table-cell">{dict.orderTable.customer}</TableHead>
          <TableHead className="hidden lg:table-cell">{dict.orderTable.dates}</TableHead>
          <TableHead className="text-right">{dict.orderTable.totalAndShare}</TableHead>
          <TableHead className="text-center">{dict.orderTable.status}</TableHead>
          <TableHead className="text-center">{dict.orderTable.actions}</TableHead>
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
            <TableCell className="text-right">
              {(() => {
                const creatorSubtotal = order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
                const creatorIva = creatorSubtotal * 0.12;
                const commissionBase = creatorSubtotal; // 10% solo sobre productos
                const tastyCommission = commissionBase * 0.1;
                const creatorTake = commissionBase * 0.9;
                const displayTotal = creatorSubtotal + creatorIva; // sin delivery (no se reparte aquí)
                return (
                  <>
                    <div className="font-medium">{formatPrice(displayTotal)}</div>
                    <div className="text-sm text-green-600 font-medium">
                      {dict.orderTable.creatorShare}: {formatPrice(creatorTake)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dict.orderTable.tastyCommission
                        ? dict.orderTable.tastyCommission(formatPrice(tastyCommission))
                        : `(Tasty 10%: ${formatPrice(tastyCommission)})`}
                    </div>
                  </>
                );
              })()}
            </TableCell>
            <TableCell className="text-center">
              <OrderStatusSelector orderId={order.id} currentStatus={order.status} />
            </TableCell>
            <TableCell className="text-center">
              <OrderStatusHistory orderId={order.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
