'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/providers/auth-provider';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingBag, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { addHours, format } from 'date-fns';
import { useDictionary } from '@/hooks/useDictionary';
import { createOrder } from '@/lib/services/orders';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function CartView() {
  const { state, dispatch } = useCart();
  const { items } = state;
  const { language } = useLanguage();
  const dict = useDictionary();
  const { user: authUser } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const handleRemoveItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const platformFee = subtotal * 0.1;
  const deliveryFee = 5.0;
  const total = subtotal + platformFee + deliveryFee;

  const maxPreparationTime = Math.max(...items.map(item => item.product.preparationTime), 0);
  const estimatedDeliveryDate = addHours(new Date(), maxPreparationTime);
  const formattedDeliveryDate = format(estimatedDeliveryDate, "EEEE, MMM d 'at' h:mm a");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!authUser) {
      toast({
        variant: "destructive",
        title: "Inicia sesión",
        description: "Debes iniciar sesión para realizar un pedido.",
      });
      router.push('/login');
      return;
    }

    setIsProcessing(true);

    try {
      const order = await createOrder({
        userId: authUser.id,
        customerName: user?.displayName || authUser.email || 'Cliente',
        items: items,
        total: total,
        deliveryDate: estimatedDeliveryDate,
      });

      if (order) {
        // Limpiar carrito
        dispatch({ type: 'CLEAR_CART' });
        
        toast({
          title: "¡Pedido realizado!",
          description: `Tu pedido #${order.id.slice(0, 8)} ha sido creado exitosamente.`,
        });
        
        router.push('/user/profile');
      } else {
        throw new Error('Error al crear la orden');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar tu pedido. Intenta de nuevo.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 font-headline text-2xl">{dict.cartView.empty.title}</h2>
        <p className="mt-2 text-muted-foreground">{dict.cartView.empty.description}</p>
        <Button asChild className="mt-6">
          <Link href="/">{dict.cartView.empty.cta}</Link>
        </Button>
      </div>
    );
  }

  // Agrupar productos por creador
  const itemsByCreator = items.reduce((acc, item) => {
    const creatorId = item.product.creatorId;
    if (!acc[creatorId]) {
      acc[creatorId] = [];
    }
    acc[creatorId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-6">
        {Object.entries(itemsByCreator).map(([creatorId, creatorItems]) => (
          <div key={creatorId} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Productos del mismo creador
              </span>
            </div>
            {creatorItems.map(({ product, quantity }) => {
              const productName = product.name[language];
              return (
                <Card key={product.id} className="flex items-center p-4">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden mr-4">
                    <Image
                      src={product.imageUrl}
                      alt={productName}
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                      data-ai-hint={product.imageHint}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-headline text-lg">{productName}</h3>
                    <p className="text-muted-foreground">{formatPrice(product.price)}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{product.preparationTime}h preparación</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                      className="w-20"
                      aria-label={`Quantity for ${productName}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(product.id)}
                      aria-label={`Remove ${productName} from cart`}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-24 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">{dict.cartView.orderSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>{dict.cartView.subtotal}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{dict.cartView.platformFee}</span>
              <span>{formatPrice(platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>{dict.cartView.deliveryFee}</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{dict.cartView.total}</span>
              <span>{formatPrice(total)}</span>
            </div>
             <Separator />
             <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{dict.cartView.estimatedDelivery}</p>
                <p>{formattedDeliveryDate}</p>
                <p className="text-xs">{dict.cartView.preparationTime(maxPreparationTime)}</p>
             </div>

          </CardContent>
          <CardFooter>
            <Button 
              asChild
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
              size="lg"
            >
              <Link href="/checkout">
                Hacer tu Pedido
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
