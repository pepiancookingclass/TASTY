'use client';

import { Badge } from "@/components/ui/badge";
import { OrderStatusKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDictionary } from '@/hooks/useDictionary';

interface OrderStatusBadgeProps {
  status: OrderStatusKey;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const dict = useDictionary();
  return (
    <Badge
      className={cn("capitalize", {
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400": status === 'new',
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400": status === 'preparing',
        "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400": status === 'ready',
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400": status === 'out_for_delivery',
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400": status === 'delivered',
        "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400": status === 'cancelled',
      })}
    >
      {dict.orderStatuses[status]}
    </Badge>
  );
}
