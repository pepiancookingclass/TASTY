'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Package, 
  Calendar, 
  MapPin, 
  Phone, 
  CreditCard, 
  AlertCircle,
  ShoppingBag,
  Gift,
  Star,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInHours, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserOrder {
  id: string;
  customer_name: string;
  total: number;
  subtotal: number;
  iva_amount: number;
  delivery_fee: number;
  delivery_breakdown: Array<{
    creator_name: string;
    delivery_fee: number;
    distance_km: number;
  }>;
  status: string;
  created_at: string;
  delivery_date: string;
  delivery_street: string;
  delivery_city: string;
  delivery_state: string;
  payment_method: string;
  items: Array<{
    product_name_es: string;
    quantity: number;
    unit_price: number;
    creator_name?: string;
  }>;
}

const statusConfig = {
  'new': { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: Package },
  'preparing': { label: 'En Preparación', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'ready': { label: 'Listo', color: 'bg-green-100 text-green-800', icon: Package },
  'out_for_delivery': { label: 'En Camino', color: 'bg-purple-100 text-purple-800', icon: MapPin },
  'delivered': { label: 'Entregado', color: 'bg-emerald-100 text-emerald-800', icon: Package },
  'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function UserOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Verificar si se puede cancelar (48 horas antes de la entrega)
  const canCancelOrder = (deliveryDate: string) => {
    const hoursUntilDelivery = differenceInHours(new Date(deliveryDate), new Date());
    return hoursUntilDelivery >= 48;
  };

  // Cargar pedidos del usuario
  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Obtener pedidos del usuario usando la función SQL con desglose
      const { data: ordersData, error: ordersError } = await supabase
        .rpc('get_user_orders_with_breakdown', { user_uuid: user.id });

      if (ordersError) throw ordersError;

      // Obtener items de cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .rpc('get_order_items_complete', { order_uuid: order.id });

          return {
            ...order,
            items: items || []
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar tus pedidos"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancelar pedido
  const cancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    
    try {
      const { error } = await supabase
        .rpc('cancel_user_order', {
          order_uuid: orderId,
          user_uuid: user?.id
        });

      if (error) throw error;

      toast({
        title: "Pedido cancelado",
        description: "Tu pedido ha sido cancelado exitosamente"
      });

      // Recargar pedidos
      loadOrders();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo cancelar el pedido"
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando tus pedidos...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <p className="text-muted-foreground">Revisa el estado de tus deliciosos pedidos</p>
        </div>
        <Button asChild>
          <Link href="/">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Hacer Nuevo Pedido
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No tienes pedidos aún</h2>
          <p className="text-muted-foreground mb-6">
            ¡Explora nuestros deliciosos productos hechos por creadores locales!
          </p>
          <Button asChild size="lg">
            <Link href="/">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Explorar Productos
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
            const StatusIcon = statusInfo?.icon || Package;
            const canCancel = canCancelOrder(order.delivery_date) && 
                             !['delivered', 'cancelled'].includes(order.status);
            const hoursUntilDelivery = differenceInHours(new Date(order.delivery_date), new Date());

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <StatusIcon className="h-5 w-5" />
                        Pedido #{order.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
                          {statusInfo?.label || order.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total</p>
                      
                      {/* Desglose de costos */}
                      {order.subtotal > 0 && order.delivery_fee > 0 && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>Productos: {formatPrice(order.subtotal)}</div>
                          <div>Delivery: {formatPrice(order.delivery_fee)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información de entrega */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Información de Entrega
                      </h4>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">
                            Entrega programada
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-blue-900">
                          {format(new Date(order.delivery_date), "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {hoursUntilDelivery > 0 
                            ? `En ${Math.ceil(hoursUntilDelivery)} horas`
                            : 'Fecha pasada'
                          }
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {order.delivery_street}, {order.delivery_city}, {order.delivery_state}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {order.payment_method === 'cash' ? 'Efectivo contra entrega' : 'Transferencia bancaria'}
                          </span>
                        </div>
                      </div>

                      {/* Política de cancelación */}
                      {!['delivered', 'cancelled'].includes(order.status) && (
                        <div className={`rounded-lg p-3 ${canCancel ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`h-4 w-4 mt-0.5 ${canCancel ? 'text-amber-600' : 'text-red-600'}`} />
                            <div>
                              <p className={`text-sm font-medium ${canCancel ? 'text-amber-800' : 'text-red-800'}`}>
                                {canCancel ? 'Puedes cancelar este pedido' : 'No se puede cancelar'}
                              </p>
                              <p className={`text-xs ${canCancel ? 'text-amber-700' : 'text-red-700'}`}>
                                {canCancel 
                                  ? `Tienes ${Math.ceil(hoursUntilDelivery - 48)} horas más para cancelar`
                                  : 'Los pedidos solo se pueden cancelar con 48 horas de anticipación'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Productos del pedido */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Productos ({order.items.length})
                      </h4>
                      
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{item.product_name_es}</p>
                              <p className="text-sm text-muted-foreground">
                                Cantidad: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatPrice(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Separator />
                      
                      {/* Desglose de costos */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Subtotal productos:</span>
                          <span>{formatPrice(order.subtotal || 0)}</span>
                        </div>
                        
                        {order.iva_amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span>IVA (12%):</span>
                            <span>{formatPrice(order.iva_amount)}</span>
                          </div>
                        )}
                        
                        {/* ✅ DESGLOSE POR ENTREGAS SEPARADAS */}
                        {order.delivery_breakdown && order.delivery_breakdown.length > 1 ? (
                          <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-800 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              💳 Pagos por Entrega Separada
                            </h4>
                            <p className="text-xs text-blue-700 mb-3">
                              Recibirás {order.delivery_breakdown.length} entregas diferentes. Paga a cada creador por separado.
                            </p>
                            
                            {order.delivery_breakdown.map((delivery, index) => {
                              // Calcular productos del creador (proporcional)
                              const creatorSubtotal = order.subtotal / order.delivery_breakdown.length; // Simplificado
                              const creatorIva = creatorSubtotal * 0.12;
                              const creatorTotal = creatorSubtotal + creatorIva + delivery.delivery_fee;
                              
                              return (
                                <div key={index} className="bg-white p-3 rounded border border-blue-100">
                                  <h5 className="font-medium text-gray-800 mb-2">
                                    🚚 {delivery.creator_name.toUpperCase()}
                                  </h5>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Sus productos:</span>
                                      <span>Q{creatorSubtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">IVA (12%):</span>
                                      <span>Q{creatorIva.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Envío ({delivery.distance_km?.toFixed(1)}km):</span>
                                      <span>Q{delivery.delivery_fee.toFixed(2)}</span>
                                    </div>
                                    <Separator className="my-1" />
                                    <div className="flex justify-between font-semibold text-green-700">
                                      <span>💰 Pagar a {delivery.creator_name}:</span>
                                      <span>Q{creatorTotal.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            <div className="text-center text-xs text-blue-600 font-medium pt-2 border-t border-blue-200">
                              ✅ Verificación: Suma de pagos = Q{order.total.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          // SINGLE CREADOR: Desglose simple
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Desglose de pago:</p>
                            <div className="pl-4 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Productos:</span>
                                <span>Q{order.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">IVA (12%):</span>
                                <span>Q{order.iva_amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Envío:</span>
                                <span>Q{order.delivery_fee.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between items-center">
                            <span>Total delivery:</span>
                            <span>{formatPrice(order.delivery_fee)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center font-semibold text-lg">
                          <span>Total:</span>
                          <span className="text-green-600">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {/* Botón WhatsApp para coordinar entrega */}
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <div className="mt-6 pt-4 border-t space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 rounded-full p-2">
                            <Phone className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800 mb-1">
                              📱 Coordinar entrega por WhatsApp
                            </h4>
                            <p className="text-sm text-green-700 mb-3">
                              Debes enviar este mensaje para reconfirmar y coordinar fecha y hora de entrega con el creador.
                            </p>
                            <Button 
                              onClick={() => {
                                // Generar mensaje WhatsApp con datos del pedido
                                const itemsList = order.items.map(item => 
                                  `• ${item.quantity}x ${item.product_name_es} - Q${(item.unit_price * item.quantity).toFixed(2)}`
                                ).join('\n');
                                
                                const message = `Hola, te saluda *${order.customer_name}*

Hice un pedido de:
${itemsList}

💰 *DESGLOSE:*
• Productos: Q${order.subtotal.toFixed(2)}
• Delivery: Q${order.delivery_fee.toFixed(2)}
• *Total: Q${order.total.toFixed(2)}*

💳 *Pago:* Efectivo contra entrega

Mi número de celular es: ${user?.phone || 'No proporcionado'}
Mi dirección de entrega es: ${order.delivery_street}, ${order.delivery_city}, ${order.delivery_state}

Agradeceré me apoyes para coordinar mi entrega.`;

                                const encodedMessage = encodeURIComponent(message);
                                const whatsappUrl = `https://wa.me/50230635323?text=${encodedMessage}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              📱 Enviar WhatsApp
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {canCancel && (
                    <div className="mt-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            disabled={cancellingOrderId === order.id}
                          >
                            {cancellingOrderId === order.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelando...
                              </>
                            ) : (
                              'Cancelar Pedido'
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres cancelar este pedido? 
                              Esta acción no se puede deshacer y se notificará a los creadores.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No, mantener pedido</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => cancelOrder(order.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sí, cancelar pedido
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sección de motivación para nuevas compras */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">¡Ofertas Especiales!</h3>
                <p className="text-sm text-purple-700">
                  Descubre descuentos exclusivos de nuestros creadores
                </p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/offers">
                Ver Ofertas
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">¡Nuevos Creadores!</h3>
                <p className="text-sm text-green-700">
                  Explora productos únicos de creadores recién llegados
                </p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/creators">
                Explorar Creadores
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recordatorio de política */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Políticas de Pedidos</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• Los pedidos deben hacerse con <strong>mínimo 48 horas de anticipación</strong></p>
                <p>• Puedes cancelar tu pedido hasta <strong>24 horas antes que inicie tu período de 48h</strong> de preparación y entrega</p>
                <p>• Nuestros creadores necesitan tiempo para preparar productos frescos y de calidad</p>
                <p>• Para pedidos urgentes, contacta directamente al creador por WhatsApp</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
