'use client';

import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge
      className={cn("capitalize", {
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400": status === 'Nuevo',
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400": status === 'En Preparación',
        "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400": status === 'Listo para Recoger',
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400": status === 'En Camino',
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400": status === 'Entregado',
        "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400": status === 'Cancelado',
      })}
    >
      {status}
    </Badge>
  );
}
