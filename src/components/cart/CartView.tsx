'use client';

import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

export function CartView() {
  const { state, dispatch } = useCart();
  const { items } = state;

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
  const deliveryFee = 5.0; // Fixed delivery fee
  const total = subtotal + platformFee + deliveryFee;

  const maxPreparationTime = Math.max(...items.map(item => item.product.preparationTime), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 font-headline text-2xl">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild className="mt-6">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-6">
        {items.map(({ product, quantity }) => (
          <Card key={product.id} className="flex items-center p-4">
            <div className="relative h-24 w-24 rounded-md overflow-hidden mr-4">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint={product.imageHint}
              />
            </div>
            <div className="flex-grow">
              <h3 className="font-headline text-lg">{product.name}</h3>
              <p className="text-muted-foreground">{formatPrice(product.price)}</p>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                className="w-20"
                aria-label={`Quantity for ${product.name}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(product.id)}
                aria-label={`Remove ${product.name} from cart`}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-24 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (10%)</span>
              <span>{formatPrice(platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                      Proceed to Checkout
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Heads up!</AlertDialogTitle>
                    <AlertDialogDescription>
                        Our chefs prepare your food with love and care. The items in your cart require up to{' '}
                        <span className="font-bold">{maxPreparationTime} hours</span> of advance notice. Please plan accordingly!
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
