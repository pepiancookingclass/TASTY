'use client';

import { ProductShowcase } from '@/components/product/ProductShowcase';
import { useProducts } from '@/hooks/useProducts';
import { useCreators } from '@/hooks/useCreators';
import { usePromotions } from '@/hooks/usePromotions';
import { PromotionsBanner } from '@/components/promotions/PromotionsBanner';
import { CreatorShowcase } from '@/components/creator/CreatorShowcase';
import { CategoryCarousel } from '@/components/category/CategoryCarousel';
import { Hero } from '@/components/shared/Hero';
import { useDictionary } from '@/hooks/useDictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const dict = useDictionary();
  const { products, loading: productsLoading } = useProducts();
  const { creators, loading: creatorsLoading } = useCreators();
  const { promotions, loading: promotionsLoading } = usePromotions();

  const sweets = products.filter(p => p.type === 'pastry' || p.type === 'dessert' || p.type === 'cookie');
  const savory = products.filter(p => p.type === 'savory');
  const handmades = products.filter(p => p.type === 'handmade');

  const isLoading = productsLoading || creatorsLoading || promotionsLoading;

  return (
    <div className="space-y-16">
      <Hero />
      
      {/* Carrusel de Categorías */}
      <CategoryCarousel />
      
      <div className="container mx-auto px-4 py-8 space-y-16">
        {creatorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : (
          <CreatorShowcase creators={creators} />
        )}

        <Card className="mt-16 text-center shadow-lg bg-secondary">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{dict.specialEvents.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {dict.specialEvents.description}
            </p>
            <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white">
              <Link href="https://wa.me/50212345678" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="mr-2 h-6 w-6" />
                {dict.specialEvents.cta}
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        {!promotionsLoading && promotions.length > 0 && (
          <PromotionsBanner promotions={promotions} />
        )}
        
        {productsLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {sweets.length > 0 && (
              <ProductShowcase products={sweets} creators={creators} title={dict.productShowcase.sweets} id="sweets" />
            )}
            {savory.length > 0 && (
              <ProductShowcase products={savory} creators={creators} title={dict.productShowcase.savory} id="savory" />
            )}
            {handmades.length > 0 && (
              <ProductShowcase products={handmades} creators={creators} title={dict.productShowcase.handmades} id="handmades" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
