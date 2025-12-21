import { supabase } from '@/lib/supabase';
import { Order, OrderStatusKey, CartItem } from '@/lib/types';

// Constantes
const AGENT_WHATSAPP = '+50230635323';

// Función para enviar WhatsApp
export function sendWhatsAppToAgent(orderData: {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  total: number;
  deliveryAddress?: string;
  paymentMethod?: string;
}) {
  const itemsList = orderData.items.map(item => 
    `• ${item.quantity}x ${item.product.name.es} - Q${(item.product.price * item.quantity).toFixed(2)}`
  ).join('\n');

  const message = `🍳 *NUEVO PEDIDO TASTY*
📋 *Pedido:* #${orderData.orderId.slice(0, 8)}
👤 *Cliente:* ${orderData.customerName}
📱 *Teléfono:* ${orderData.customerPhone || 'No proporcionado'}

📦 *PRODUCTOS:*
${itemsList}

💰 *TOTAL:* Q${orderData.total.toFixed(2)}
💳 *Pago:* ${orderData.paymentMethod === 'cash' ? 'Efectivo contra entrega' : 'Transferencia bancaria'}
📍 *Entrega:* ${orderData.deliveryAddress || 'Dirección no especificada'}

⚠️ *FAVOR CONFIRMAR ESTE PEDIDO CON EL CLIENTE*`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${AGENT_WHATSAPP.replace('+', '')}?text=${encodedMessage}`;
  
  return whatsappUrl;
}

// Función para generar mensaje de confirmación para el cliente
export function generateCustomerWhatsAppMessage(orderData: {
  orderId: string;
  customerName: string;
  items: CartItem[];
  total: number;
}) {
  const itemsList = orderData.items.map(item => 
    `• ${item.quantity}x ${item.product.name.es} - Q${(item.product.price * item.quantity).toFixed(2)}`
  ).join('\n');

  const message = `🍳 *CONFIRMACIÓN DE PEDIDO TASTY*
📋 *Tu pedido:* #${orderData.orderId.slice(0, 8)}

📦 *PRODUCTOS:*
${itemsList}

💰 *TOTAL:* Q${orderData.total.toFixed(2)}

📱 *FAVOR ENVÍA ESTE MENSAJE A NUESTRO AGENTE PARA RECONFIRMAR TU PEDIDO*`;

  return message;
}

// Tipo para crear una orden
export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: CartItem[];
  total: number;
  deliveryDate: Date;
  deliveryAddress?: {
    street?: string;
    department?: string;
    municipality?: string;
    notes?: string;
  };
  paymentMethod?: string;
  // Opciones de privacidad
  userLocation?: { lat: number; lng: number } | null;
  saveLocationData?: boolean;
  autoDeleteAfterDelivery?: boolean;
}

// Transformar datos de Supabase a Order
function transformOrder(data: any, items: any[] = []): Order {
  return {
    id: data.id,
    customerName: data.customer_name,
    orderDate: new Date(data.order_date),
    deliveryDate: new Date(data.delivery_date),
    items: items.map(item => ({
      product: {
        id: item.product_id,
        name: { en: item.product_name_en || '', es: item.product_name_es || '' },
        type: 'pastry', // Default, se puede mejorar
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
    status: data.status as OrderStatusKey,
    total: parseFloat(data.total),
  };
}

// Crear una orden
export async function createOrder(input: CreateOrderInput): Promise<{ order: Order | null; whatsappUrl: string; customerMessage: string }> {
  // Crear la orden
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: input.userId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail,
      total: input.total,
      delivery_date: input.deliveryDate.toISOString(),
      delivery_street: input.deliveryAddress?.street,
      delivery_city: input.deliveryAddress?.municipality,
      delivery_state: input.deliveryAddress?.department,
      delivery_notes: input.deliveryAddress?.notes,
      payment_method: input.paymentMethod || 'cash',
      // Datos de ubicación y privacidad
      delivery_latitude: input.userLocation?.lat,
      delivery_longitude: input.userLocation?.lng,
      save_location_data: input.saveLocationData || false,
      auto_delete_after_delivery: input.autoDeleteAfterDelivery || false,
      status: 'new',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return { order: null, whatsappUrl: '', customerMessage: '' };
  }

  // Crear los items de la orden
  const orderItems = input.items.map(item => ({
    order_id: orderData.id,
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.price,
    product_name_en: item.product.name.en,
    product_name_es: item.product.name.es,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // La orden ya fue creada, pero sin items
  }

  // Generar URLs de WhatsApp
  const deliveryAddressText = input.deliveryAddress ? 
    `${input.deliveryAddress.street}, ${input.deliveryAddress.municipality}, ${input.deliveryAddress.department}` : 
    'No especificada';

  const whatsappUrl = sendWhatsAppToAgent({
    orderId: orderData.id,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    items: input.items,
    total: input.total,
    deliveryAddress: deliveryAddressText,
    paymentMethod: input.paymentMethod
  });

  const customerMessage = generateCustomerWhatsAppMessage({
    orderId: orderData.id,
    customerName: input.customerName,
    items: input.items,
    total: input.total
  });

  // Manejar opciones de privacidad
  if (input.saveLocationData && !input.autoDeleteAfterDelivery) {
    // Guardar datos de ubicación en el perfil del usuario para futuros pedidos
    await supabase
      .from('users')
      .update({
        address_street: input.deliveryAddress?.street,
        address_city: input.deliveryAddress?.municipality,
        address_state: input.deliveryAddress?.department,
        latitude: input.userLocation?.lat,
        longitude: input.userLocation?.lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', input.userId);
  }

  const order = transformOrder(orderData, orderItems);
  
  // Enviar emails automáticamente (se ejecuta via trigger en DB)
  // El trigger 'send_emails_on_order_creation' se encarga de todo
  
  return { order, whatsappUrl, customerMessage };
}

// Obtener órdenes por usuario
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data.map(order => transformOrder(order, order.order_items));
}

// Obtener órdenes para un creador (órdenes que contienen sus productos)
export async function getOrdersByCreator(creatorId: string): Promise<Order[]> {
  // Primero obtenemos los IDs de productos del creador
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('creator_id', creatorId);

  if (productsError || !products?.length) {
    return [];
  }

  const productIds = products.map(p => p.id);

  // Obtenemos los order_items que contienen esos productos
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id')
    .in('product_id', productIds);

  if (itemsError || !orderItems?.length) {
    return [];
  }

  const orderIds = [...new Set(orderItems.map(item => item.order_id))];

  // Obtenemos las órdenes
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .in('id', orderIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching creator orders:', error);
    return [];
  }

  return data.map(order => transformOrder(order, order.order_items));
}

// Obtener una orden por ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return transformOrder(data, data.order_items);
}

// Actualizar estado de una orden
export async function updateOrderStatus(orderId: string, status: OrderStatusKey): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }

  return true;
}

// Obtener todas las órdenes (para admin)
export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }

  return data.map(order => transformOrder(order, order.order_items));
}

