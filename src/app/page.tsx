'use client';

import { ProductShowcase } from '@/components/product/ProductShowcase';
import { products, sampleCreator, promotions } from '@/lib/data';
import type { Creator } from '@/lib/types';
import { PromotionsBanner } from '@/components/promotions/PromotionsBanner';
import { CreatorShowcase } from '@/components/creator/CreatorShowcase';
import { Hero } from '@/components/shared/Hero';
import { useDictionary } from '@/hooks/useDictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

export default function Home() {
  const dict = useDictionary();
  // In a real app, you'd fetch multiple creators
  const creators: Creator[] = [
      sampleCreator,
      { id: 'creator-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=1080', imageHint: 'creator portrait', gender: 'male' },
  ]; 

  const sweets = products.filter(p => p.type === 'pastry' || p.type === 'dessert');
  const savory = products.filter(p => p.type === 'savory');
  const handmades = products.filter(p => p.type === 'handmade');

  return (
    <div className="space-y-16">
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-16">
        <CreatorShowcase creators={creators} />

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
        
        <PromotionsBanner promotions={promotions} />
        <ProductShowcase products={sweets} creators={creators} title={dict.productShowcase.sweets} id="sweets" />
        <ProductShowcase products={savory} creators={creators} title={dict.productShowcase.savory} id="savory" />
        <ProductShowcase products={handmades} creators={creators} title={dict.productShowcase.handmades} id="handmades" />
      </div>
    </div>
  );
}
