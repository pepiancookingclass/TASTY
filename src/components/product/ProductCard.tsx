'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Creator } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PlusCircle, Clock, Ban, Images, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const t = dict.productCard;
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls 
    : product.imageUrl ? [product.imageUrl] : [];
  
  const hasMultipleImages = images.length > 1;

  const openLightbox = () => {
    if (images.length > 0) {
      setCurrentImageIndex(0);
      setIsLightboxOpen(true);
    }
  };

  const closeLightbox = () => setIsLightboxOpen(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };


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

  // Obtener primera imagen (compatibilidad con imageUrls y imageUrl)
  const displayImage = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls[0] 
    : product.imageUrl;
  
  const isSoldOut = product.isSoldOut || false;

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden h-full transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-md hover:shadow-xl",
      isSoldOut && "opacity-75"
    )}>
      <CardHeader className="p-0">
        <div 
          className="relative aspect-square overflow-hidden cursor-pointer group"
          onClick={openLightbox}
        >
          <Image
            src={displayImage}
            alt={productName}
            fill
            className={cn(
              "object-cover object-center transition-transform duration-300 group-hover:scale-110",
              isSoldOut && "grayscale"
            )}
            data-ai-hint={product.imageHint}
          />
          
          {/* Indicador de múltiples imágenes */}
          {hasMultipleImages && !isSoldOut && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Images className="h-3 w-3" />
              <span>1/{images.length}</span>
            </div>
          )}
          
          {/* Badge AGOTADO */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 rotate-[-15deg] shadow-lg">
                <Ban className="h-5 w-5" />
                AGOTADO
              </div>
            </div>
          )}
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
          <span>
            {(t?.preparationLabel ?? 'Preparación')}: {product.preparationTime}h
          </span>
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
                  {t?.by ?? dict.productCard.by} {creator.name}
                </span>
            </Link>
        )}
        <div className="w-full flex justify-between items-center">
            <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
            <Button onClick={handleAddToCart} size="sm" disabled={isSoldOut}>
              {isSoldOut ? (
                <>
                  <Ban className="mr-2 h-4 w-4" /> Agotado
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" /> {dict.productCard.addToCart}
                </>
              )}
            </Button>
        </div>
      </CardFooter>
      
      {/* Modal Lightbox para galería de imágenes */}
      {isLightboxOpen && images.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Botón cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
          >
            <X className="h-8 w-8" />
          </button>
          
          {/* Botón anterior */}
          {hasMultipleImages && (
            <button
              onClick={prevImage}
              className="absolute left-4 text-white hover:text-gray-300 z-10 p-2"
            >
              <ChevronLeft className="h-12 w-12" />
            </button>
          )}
          
          {/* Imagen principal */}
          <div 
            className="relative max-w-4xl max-h-[80vh] w-full h-full m-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentImageIndex]}
              alt={`${productName} - Imagen ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>
          
          {/* Botón siguiente */}
          {hasMultipleImages && (
            <button
              onClick={nextImage}
              className="absolute right-4 text-white hover:text-gray-300 z-10 p-2"
            >
              <ChevronRight className="h-12 w-12" />
            </button>
          )}
          
          {/* Indicador de posición y miniaturas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {/* Miniaturas */}
            {hasMultipleImages && (
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={cn(
                      "relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all",
                      currentImageIndex === idx 
                        ? "border-white ring-2 ring-white/50" 
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Contador */}
            <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
          
          {/* Info del producto */}
          <div className="absolute top-4 left-4 right-16 text-white max-h-[40%] overflow-y-auto">
            <h3 className="text-lg font-bold">{productName}</h3>
            <p className="text-sm text-gray-300 mb-2">{formatPrice(product.price)}</p>
            
            {/* Descripción */}
            {productDescription && (
              <div className="mt-2">
                <p className="text-sm text-gray-200 leading-relaxed">{productDescription}</p>
              </div>
            )}
            
            {/* Ingredientes (solo si existen) */}
            {product.ingredients[language] && product.ingredients[language].trim() !== '' && (
              <div className="mt-3 pt-2 border-t border-white/20">
                <p className="text-xs text-gray-400 font-medium mb-1">{t?.ingredients ?? 'Ingredientes'}:</p>
                <p className="text-xs text-gray-300">{product.ingredients[language]}</p>
              </div>
            )}
            
            {/* Badges dietéticos */}
            {dietaryBadges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {dietaryBadges.map(badge => (
                  <span key={badge.key} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded">
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
