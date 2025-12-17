'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatusKey } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useOrders } from '@/hooks/useOrders';
import { useDictionary } from '@/hooks/useDictionary';

interface OrderStatusSelectorProps {
  orderId: string;
  currentStatus: OrderStatusKey;
}

const orderStatuses: OrderStatusKey[] = [
  'new',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export function OrderStatusSelector({ orderId, currentStatus }: OrderStatusSelectorProps) {
  const { toast } = useToast();
  const { updateOrderStatus } = useOrders();
  const dict = useDictionary();

  const handleStatusChange = (newStatus: OrderStatusKey) => {
    updateOrderStatus(orderId, newStatus);
    toast({
        title: dict.orderStatusSelector.toastTitle,
        description: dict.orderStatusSelector.toastDescription(orderId, dict.orderStatuses[newStatus]),
    });
  };

  return (
    <Select defaultValue={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={dict.orderStatusSelector.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {orderStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {dict.orderStatuses[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
