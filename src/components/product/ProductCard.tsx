'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product, Creator } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PlusCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useDictionary } from '@/hooks/useDictionary';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  creator?: Creator;
}

export function ProductCard({ product, creator }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const dict = useDictionary();
  const { trackProductView, trackProductAddToCart } = useAnalytics();
  const productName = product.name[language];
  const productDescription = product.description[language];


  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    
    // Track analytics
    trackProductAddToCart(
      product.id, 
      productName, 
      product.price, 
      1
    );
    
    toast({
      title: dict.productCard.addedToCart,
      description: dict.productCard.inYourCart(productName),
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(price);
  };
  
  const dietaryBadges = product.type !== 'handmade' 
    ? Object.entries(product.dietaryFlags)
      .filter(([, value]) => value)
      .map(([key]) => {
        const labels: Record<string, string> = {
          isGlutenFree: "GF",
          isVegan: "V",
          isDairyFree: "DF",
          isNutFree: "NF",
        };
        return { key, label: labels[key] };
      })
    : [];

  return (
    <Card className="flex flex-col overflow-hidden h-full transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-md hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={productName}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            data-ai-hint={product.imageHint}
            className="transition-transform duration-300 hover:scale-110"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-xl mb-2">{productName}</CardTitle>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {productDescription}
        </p>
        
        {/* Tiempo de preparación */}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{product.preparationTime}h de preparación</span>
        </div>
        
         <div className="flex flex-wrap gap-2 mt-2 h-6">
          {dietaryBadges.map(badge => (
            <Badge key={badge.key} variant="secondary">{badge.label}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start space-y-4">
        {creator && (
            <Link 
              href={`/creators/${creator.id}`}
              className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
                <Avatar className={cn(
                  "h-8 w-8 border-2",
                  creator.gender === 'female' ? 'border-primary' : 'border-blue-400'
                )}>
                    <AvatarImage src={creator.profilePictureUrl} alt={creator.name} data-ai-hint={creator.imageHint} />
                    <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">
                  {dict.productCard.by} {creator.name}
                </span>
            </Link>
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
