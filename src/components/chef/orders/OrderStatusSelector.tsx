'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface OrderStatusSelectorProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const orderStatuses: OrderStatus[] = [
  'Nuevo',
  'En Preparación',
  'Listo para Recoger',
  'En Camino',
  'Entregado',
  'Cancelado',
];

export function OrderStatusSelector({ orderId, currentStatus }: OrderStatusSelectorProps) {
  const { toast } = useToast();

  const handleStatusChange = (newStatus: OrderStatus) => {
    // In a real app, this would trigger an API call to update the database.
    console.log(`Updating order ${orderId} to status: ${newStatus}`);
    toast({
        title: "Order Status Updated",
        description: `Order ${orderId} is now "${newStatus}".`,
    });
  };

  return (
    <Select defaultValue={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Update status" />
      </SelectTrigger>
      <SelectContent>
        {orderStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
