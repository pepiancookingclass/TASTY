'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import type { Promotion } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay"

interface PromotionsBannerProps {
  promotions: Promotion[];
}

export function PromotionsBanner({ promotions }: PromotionsBannerProps) {
  return (
    <div className="mb-12">
      <h2 className="font-headline text-3xl font-bold mb-6 text-center">
        Special Offers
      </h2>
      <Carousel 
        className="w-full"
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: true,
          }),
        ]}
        opts={{
            loop: true,
        }}
      >
        <CarouselContent>
          {promotions.map((promo) => (
            <CarouselItem key={promo.id}>
              <Card className="overflow-hidden border-2 border-accent shadow-lg">
                <CardContent className="p-0">
                  <div className="relative h-48 md:h-64">
                    <Image
                      src={promo.imageUrl}
                      alt={promo.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint={promo.imageHint}
                    />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                      <h3 className="font-headline text-2xl md:text-4xl font-bold text-white">
                        {promo.title}
                      </h3>
                      <p className="mt-2 text-md md:text-lg text-white">
                        {promo.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-14" />
        <CarouselNext className="mr-14"/>
      </Carousel>
    </div>
  );
}
