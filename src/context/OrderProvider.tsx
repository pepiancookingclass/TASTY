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
      console.log('📭 CreatorOrders: sin usuario, limpiando pedidos');
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 CreatorOrders: cargando pedidos para', user.id);
      // 1) Obtener los productos del creador (sin joins para evitar recursión RLS)
      const { data: creatorProducts, error: creatorProductsError } = await supabase
        .from('products')
        .select('id')
        .eq('creator_id', user.id);

      if (creatorProductsError) throw creatorProductsError;

      const creatorProductIds = (creatorProducts || []).map((p) => p.id);

      if (creatorProductIds.length === 0) {
        console.log('📭 CreatorOrders: creador no tiene productos, 0 pedidos');
        setOrders([]);
        return;
      }

      console.log('📦 CreatorOrders: productos del creador', creatorProductIds.length);

      // 2) Encontrar order_items que correspondan a esos productos (sin join)
      const { data: creatorItems, error: itemsForCreatorError } = await supabase
        .from('order_items')
        .select('order_id')
        .in('product_id', creatorProductIds);

      if (itemsForCreatorError) throw itemsForCreatorError;

      const orderIds = Array.from(new Set((creatorItems || []).map((row) => row.order_id)));

      if (orderIds.length === 0) {
        console.log('📭 CreatorOrders: no hay order_items para productos del creador');
        setOrders([]);
        return;
      }

      console.log('🧾 CreatorOrders: ordenes encontradas', orderIds.length);

      // 3) Traer órdenes y sus items (sin joins complejos)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      const transformedOrders: Order[] = [];

      for (const order of orderData || []) {
        console.log('🔍 CreatorOrders: cargando items para orden', order.id);
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
          .in('product_id', creatorProductIds);

        if (!itemsError && items) {
          console.log('✅ CreatorOrders: items cargados', items.length, 'para orden', order.id);
          const transformedOrder = transformOrderFromDB(order, items);
          transformedOrders.push(transformedOrder);
        }
      }

      console.log('🏁 CreatorOrders: pedidos cargados', transformedOrders.length);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('❌ CreatorOrders: error loading orders:', error);
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
