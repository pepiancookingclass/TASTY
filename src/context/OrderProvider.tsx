'use client';

import React, { createContext, useState, ReactNode } from 'react';
import type { Order, OrderStatusKey } from '@/lib/types';
import { products } from '@/lib/data';

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
    status: 'preparing',
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
    status: 'ready',
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
    status: 'delivered',
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
    status: 'new',
    total: 12.00,
  },
];


type OrderContextType = {
  orders: Order[];
  updateOrderStatus: (orderId: string, newStatus: OrderStatusKey) => void;
};

export const OrderContext = createContext<OrderContextType | null>(null);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatusKey) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  return (
    <OrderContext.Provider value={{ orders, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};
