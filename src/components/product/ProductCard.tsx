'use client';

import Image from 'next/image';
import { Product, Chef } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useDictionary } from '@/hooks/useDictionary';

interface ProductCardProps {
  product: Product;
  chef?: Chef;
}

export function ProductCard({ product, chef }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const dict = useDictionary();
  const productName = product.name[language];
  const productDescription = product.description[language];


  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    toast({
      title: dict.productCard.addedToCart,
      description: dict.productCard.inYourCart(productName),
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
            alt={productName}
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={product.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-xl mb-2">{productName}</CardTitle>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {productDescription}
        </p>
         <div className="flex flex-wrap gap-2 mt-3">
          {dietaryBadges.map(badge => (
            <Badge key={badge.key} variant="secondary">{badge.label}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start space-y-4">
        {chef && (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={chef.profilePictureUrl} alt={chef.name} data-ai-hint={chef.imageHint} />
                    <AvatarFallback>{chef.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-medium">{dict.productCard.by} {chef.name}</span>
            </div>
        )}
        <div className="w-full flex justify-between items-center">
            <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
            <Button onClick={handleAddToCart} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> {dict.productCard.addToCart}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
