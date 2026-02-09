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

  const message = `🍳 *NUEVO PEDIDO TASTY - SISTEMA*
📋 *Pedido:* #${orderData.orderId.slice(0, 8)}
👤 *Cliente:* ${orderData.customerName}
${orderData.customerPhone && orderData.customerPhone.trim() !== '' ? `📱 *Teléfono:* ${orderData.customerPhone}` : ''}

📦 *PRODUCTOS:*
${itemsList}

💰 *TOTAL:* Q${orderData.total.toFixed(2)}
💳 *Pago:* ${orderData.paymentMethod === 'cash' ? 'Efectivo contra entrega' : 'Transferencia bancaria'}
📍 *Entrega:* ${orderData.deliveryAddress || 'Dirección no especificada'}

⚠️ *ESPERANDO QUE EL CLIENTE TE ESCRIBA DIRECTAMENTE PARA COORDINAR ENTREGA*`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${AGENT_WHATSAPP.replace('+', '')}?text=${encodedMessage}`;
  
  return whatsappUrl;
}

// Función para generar URL de WhatsApp directo para el cliente
export function generateCustomerWhatsAppUrl(orderData: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  deliveryAddress: string;
  paymentMethod: string;
  subtotal?: number;
  ivaAmount?: number;
  deliveryFee?: number;
  deliveryBreakdown?: Array<{
    creator_id: string;
    creator_name: string;
    delivery_fee: number;
    distance_km: number;
    vehicle?: string;
  }>;
}) {
  // Construir lista de productos
  const itemsList = orderData.items.map(item => 
    `• ${item.quantity}x ${item.product.name.es} - Q${(item.product.price * item.quantity).toFixed(2)}`
  ).join('\n');

  // Calcular valores financieros con fallback seguro
  const calculatedSubtotal = typeof orderData.subtotal === 'number'
    ? orderData.subtotal
    : orderData.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const calculatedIva = Number.isFinite(orderData.ivaAmount)
    ? (orderData.ivaAmount as number)
    : calculatedSubtotal * 0.12;
  const calculatedDeliveryFee = Number.isFinite(orderData.deliveryFee)
    ? (orderData.deliveryFee as number)
    : (orderData.total - calculatedSubtotal - calculatedIva);

  // Construir sección de teléfono
  const phone = (orderData.customerPhone || '').trim();
  const phoneSection = `📱 Mi número de celular es: ${phone || '(sin teléfono capturado, contáctame por WhatsApp)'}`;

  // Construir sección de entregas por creador con vehículo
  let deliverySection = '';
  if (orderData.deliveryBreakdown && orderData.deliveryBreakdown.length > 1) {
    deliverySection = '\n🚚 *ENTREGAS SEPARADAS:*\n';
    orderData.deliveryBreakdown.forEach(d => {
      const vehicleText = d.vehicle === 'auto' ? 'Auto' : 'Moto';
      deliverySection += `• ${d.creator_name}: Q${d.delivery_fee.toFixed(2)} (${vehicleText})\n`;
    });
  } else if (orderData.deliveryBreakdown && orderData.deliveryBreakdown.length === 1) {
    const d = orderData.deliveryBreakdown[0];
    const vehicleText = d.vehicle === 'auto' ? 'Auto' : 'Moto';
    deliverySection = `\n🚚 *Tipo de entrega:* ${vehicleText}`;
  }

  // Construir mensaje en líneas para asegurar saltos y presencia de IVA
  const messageLines = [
    `Hola, te saluda *${orderData.customerName}*`,
    '',
    'Hice un pedido de:',
    itemsList,
    '',
    '💰 *DESGLOSE:*',
    `• Productos: Q${calculatedSubtotal.toFixed(2)}`,
    `• IVA (12%): Q${calculatedIva.toFixed(2)}`,
    `• Delivery: Q${calculatedDeliveryFee.toFixed(2)}`,
    `• *TOTAL: Q${orderData.total.toFixed(2)}*`,
    deliverySection,
    `💳 *Pago:* ${orderData.paymentMethod === 'cash' ? 'Efectivo contra entrega' : 'Transferencia bancaria'}`,
    phoneSection,
    `📍 Mi dirección de entrega es: ${orderData.deliveryAddress}`,
    '',
    'Agradeceré me apoyes para coordinar mi entrega. 🙏'
  ];

  const message = messageLines.join('\n');

  console.log('🧪 PREVIEW WHATSAPP CLIENTE:', {
    orderId: orderData.orderId,
    phone: orderData.customerPhone,
    subtotal: calculatedSubtotal,
    iva: calculatedIva,
    deliveryFee: calculatedDeliveryFee,
    total: orderData.total,
    preview: message.slice(0, 400)
  });

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${AGENT_WHATSAPP.replace('+', '')}?text=${encodedMessage}`;
  
  return whatsappUrl;
}

// Tipo para crear una orden
export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerPhone?: string;
  fallbackPhone?: string;
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
  // Desglose de delivery
  deliveryBreakdown?: Array<{
    creator_id: string;
    creator_name: string;
    delivery_fee: number;
    distance_km: number;
    vehicle?: string;
  }>;
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
export async function createOrder(input: CreateOrderInput): Promise<{ order: Order | null; whatsappUrl: string; customerWhatsAppUrl: string }> {
  console.log('🚀 INICIANDO CREACIÓN DE ORDEN:', {
    userId: input.userId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    fallbackPhone: input.fallbackPhone,
    total: input.total,
    itemsCount: input.items.length
  });
  
  // ✅ DEBUG: Ver qué items llegan
  console.log('🛒 ITEMS RECIBIDOS:', input.items.map(item => ({
    name: item.product.name.es,
    price: item.product.price,
    quantity: item.quantity,
    total: item.product.price * item.quantity
  })));
  
  const finalPhone = [input.customerPhone, input.fallbackPhone]
    .find((p) => p && p.trim() !== '')?.trim() || '';
  console.log('📞 WHATSAPP: teléfono final seleccionado', {
    providedPhone: input.customerPhone,
    fallbackPhone: input.fallbackPhone,
    finalPhone
  });
  
  // Calcular subtotal de productos SIN IVA
  const subtotal = input.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const ivaAmount = subtotal * 0.12;
  const deliveryFee = input.total - subtotal - ivaAmount;
  
  console.log('💰 DESGLOSE FINANCIERO:', {
    subtotal: subtotal,
    ivaAmount: ivaAmount,
    deliveryFee: deliveryFee,
    total: input.total
  });

  // ✅ DEBUG: WhatsApp data que se pasa
  console.log('📱 DATOS PARA WHATSAPP:', {
    subtotal: subtotal,
    ivaAmount: ivaAmount,
    deliveryFee: deliveryFee,
    total: input.total,
    finalPhone,
    itemsCount: input.items.length
  });
  
  // Crear la orden
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: input.userId,
      customer_name: input.customerName,
      customer_phone: finalPhone,
      customer_email: input.customerEmail,
      total: input.total,
      subtotal: subtotal,
      iva_amount: ivaAmount,
      delivery_fee: deliveryFee,
      delivery_breakdown: input.deliveryBreakdown || [],
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
    console.error('❌ ERROR DETALLADO CREANDO ORDEN:', {
      message: orderError.message,
      details: orderError.details,
      hint: orderError.hint,
      code: orderError.code,
      statusCode: orderError.status,
      fullError: orderError
    });
    console.error('📊 DATOS QUE SE INTENTARON INSERTAR:', {
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
      delivery_latitude: input.userLocation?.lat,
      delivery_longitude: input.userLocation?.lng,
      save_location_data: input.saveLocationData || false,
      auto_delete_after_delivery: input.autoDeleteAfterDelivery || false,
      status: 'new'
    });
    throw new Error(`Error al crear la orden: ${orderError.message}`);
  }

  console.log('✅ INSERT EN TABLA ORDERS EXITOSO:', {
    orderId: orderData.id,
    insertedAt: orderData.created_at
  });

  // Crear los items de la orden PRIMERO (antes de enviar emails)
  const orderItems = input.items.map(item => ({
    order_id: orderData.id,
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.price,
    product_name_en: item.product.name.en,
    product_name_es: item.product.name.es,
    delivery_vehicle: item.product.deliveryVehicle || 'moto',
  }));

  console.log('📦 INSERTANDO ORDER_ITEMS:', orderItems.length, 'productos');

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('❌ Error creating order items:', itemsError);
  } else {
    console.log('✅ ORDER_ITEMS INSERTADOS CORRECTAMENTE');
  }

  // AHORA enviar emails (después de que los items existan en la BD)
  console.log('🔄 ENVIANDO EMAILS VIA FETCH DIRECTO...');
  try {
    const response = await fetch('https://aitmxnfljglwpkpibgek.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdG14bmZsamdsd3BrcGliZ2VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAxNTM3MCwiZXhwIjoyMDgxNTkxMzcwfQ.hrrCFLJJ2IKwMuewr4SVacMVMqq_Xsa97aOBcIDmaO4'
      },
      body: JSON.stringify({ order_uuid: orderData.id })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ EMAILS ENVIADOS:', result);
    } else {
      console.error('❌ ERROR FETCH:', await response.text());
    }
  } catch (error) {
    console.error('❌ ERROR FETCH DIRECTO:', error);
  }

  // Generar URLs de WhatsApp
  const deliveryAddressText = input.deliveryAddress ? 
    `${input.deliveryAddress.street}, ${input.deliveryAddress.municipality}, ${input.deliveryAddress.department}` : 
    'No especificada';

  const whatsappUrl = sendWhatsAppToAgent({
    orderId: orderData.id,
    customerName: input.customerName,
    customerPhone: finalPhone,
    items: input.items,
    total: input.total,
    deliveryAddress: deliveryAddressText,
    paymentMethod: input.paymentMethod
  });

  console.log('📱 GENERANDO WHATSAPP URL CON:', {
    subtotal: subtotal,
    ivaAmount: ivaAmount,
    deliveryFee: deliveryFee,
    total: input.total
  });

  const customerWhatsAppUrl = generateCustomerWhatsAppUrl({
    orderId: orderData.id,
    customerName: input.customerName,
    customerPhone: finalPhone,
    items: input.items,
    total: input.total,
    deliveryAddress: deliveryAddressText,
    paymentMethod: input.paymentMethod || 'cash',
    subtotal: subtotal,
    ivaAmount: ivaAmount,
    deliveryFee: deliveryFee,
    deliveryBreakdown: input.deliveryBreakdown
  });

  console.log('📱 WHATSAPP URL GENERADA:', customerWhatsAppUrl.substring(0, 200) + '...');

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
  
  console.log('🔍 ORDEN CREADA EXITOSAMENTE:', {
    orderId: orderData.id,
    status: orderData.status,
    itemsCount: orderItems.length,
    timestamp: new Date().toISOString()
  });
  
  return { order, whatsappUrl, customerWhatsAppUrl };
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

