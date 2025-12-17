'use client';

import Image from 'next/image';
import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    toast({
      title: 'Added to cart!',
      description: `${product.name} is now in your shopping cart.`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  const dietaryBadges = Object.entries(product.dietaryFlags)
    .filter(([, value]) => value)
    .map(([key]) => {
      const labels: Record<string, string> = {
        isGlutenFree: "GF",
        isVegan: "V",
        isDairyFree: "DF",
        isNutFree: "NF",
      };
      return { key, label: labels[key] };
    });

  return (
    <Card className="flex flex-col overflow-hidden h-full transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-md hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={product.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-xl mb-2">{product.name}</CardTitle>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {product.description.en}
        </p>
         <div className="flex flex-wrap gap-2 mt-3">
          {dietaryBadges.map(badge => (
            <Badge key={badge.key} variant="secondary">{badge.label}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
        <Button onClick={handleAddToCart} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
