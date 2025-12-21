'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Order, OrderStatusKey } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';

// Función para transformar datos de Supabase a Order
function transformOrderFromDB(orderData: any, orderItems: any[]): Order {
  return {
    id: orderData.id,
    customerName: orderData.customer_name,
    orderDate: new Date(orderData.created_at),
    deliveryDate: new Date(orderData.delivery_date),
    status: orderData.status as OrderStatusKey,
    total: parseFloat(orderData.total),
    items: orderItems.map(item => ({
      product: {
        id: item.product_id,
        name: { 
          en: item.product_name_en || '', 
          es: item.product_name_es || '' 
        },
        type: 'pastry', // Default
        price: parseFloat(item.unit_price),
        imageUrl: '',
        imageHint: '',
        description: { en: '', es: '' },
        ingredients: { en: '', es: '' },
        creatorId: '',
        preparationTime: 0,
        dietaryFlags: {
          isGlutenFree: false,
          isVegan: false,
          isDairyFree: false,
          isNutFree: false,
        },
      },
      quantity: item.quantity,
    })),
  };
}


type OrderContextType = {
  orders: Order[];
  loading: boolean;
  updateOrderStatus: (orderId: string, newStatus: OrderStatusKey) => Promise<void>;
  refreshOrders: () => Promise<void>;
};

export const OrderContext = createContext<OrderContextType | null>(null);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cargar pedidos del creador desde la base de datos
  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Obtener pedidos que incluyen productos del creador
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products!inner (
              creator_id
            )
          )
        `)
        .eq('order_items.products.creator_id', user.id)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      // Transformar datos
      const transformedOrders: Order[] = [];
      
      for (const order of orderData || []) {
        // Obtener items del pedido
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (!itemsError && items) {
          const transformedOrder = transformOrderFromDB(order, items);
          transformedOrders.push(transformedOrder);
        }
      }

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los pedidos"
      });
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de pedido usando la función SQL
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatusKey) => {
    try {
      const { error } = await supabase
        .rpc('update_order_status', {
          order_uuid: orderId,
          new_status: newStatus,
          changed_by_uuid: user?.id
        });

      if (error) throw error;

      // Actualizar estado local
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: "Estado actualizado",
        description: `El pedido ahora está "${newStatus}"`
      });

    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado del pedido"
      });
    }
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    loadOrders();
  }, [user]);

  return (
    <OrderContext.Provider value={{ 
      orders, 
      loading, 
      updateOrderStatus, 
      refreshOrders: loadOrders 
    }}>
      {children}
    </OrderContext.Provider>
  );
};
