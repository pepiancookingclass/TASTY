'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ProductImageCarousel({ images, productName, className }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Si no hay imágenes, mostrar placeholder
  if (!images || images.length === 0) {
    return (
      <div className={cn("relative aspect-square bg-muted rounded-lg flex items-center justify-center", className)}>
        <span className="text-muted-foreground">Sin imagen</span>
      </div>
    );
  }

  // Si solo hay una imagen, no mostrar controles
  if (images.length === 1) {
    return (
      <div className={cn("relative aspect-square rounded-lg overflow-hidden", className)}>
        <Image
          src={images[0]}
          alt={productName}
          fill
          className="object-cover"
          priority
        />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Imagen principal */}
      <div className="relative aspect-square rounded-lg overflow-hidden">
        <Image
          src={images[currentIndex]}
          alt={`${productName} - Imagen ${currentIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          priority={currentIndex === 0}
        />

        {/* Botones de navegación */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md"
          onClick={goToNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Indicador de posición */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Miniaturas */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
        {images.map((url, index) => (
          <button
            key={`thumb-${index}`}
            onClick={() => goToIndex(index)}
            className={cn(
              "relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
              currentIndex === index 
                ? "border-primary ring-2 ring-primary/20" 
                : "border-transparent hover:border-muted-foreground/50"
            )}
          >
            <Image
              src={url}
              alt={`${productName} miniatura ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
