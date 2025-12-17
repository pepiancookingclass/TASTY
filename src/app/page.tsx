'use client';

import { ProductShowcase } from '@/components/product/ProductShowcase';
import { products, sampleChef, promotions } from '@/lib/data';
import type { Chef } from '@/lib/types';
import { PromotionsBanner } from '@/components/promotions/PromotionsBanner';
import { ChefShowcase } from '@/components/chef/ChefShowcase';
import { Hero } from '@/components/shared/Hero';
import { useDictionary } from '@/hooks/useDictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

export default function Home() {
  const dict = useDictionary();
  // In a real app, you'd fetch multiple chefs
  const chefs: Chef[] = [
      sampleChef,
      { id: 'chef-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=1080', imageHint: 'chef portrait', gender: 'male' },
  ]; 

  const sweets = products.filter(p => p.type === 'pastry' || p.type === 'dessert');
  const savory = products.filter(p => p.type === 'savory');

  return (
    <div className="space-y-16">
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-16">
        <ChefShowcase chefs={chefs} />

        <Card className="mt-16 text-center shadow-lg bg-secondary">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">¿Eventos o Pedidos Especiales?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                    ¿Planeando una celebración o necesitas algo hecho a tu medida? Contáctanos para discutir tus ideas.
                </p>
                <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                    <Link href="https://wa.me/50212345678" target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon className="mr-2 h-6 w-6" />
                        Contactar por WhatsApp
                    </Link>
                </Button>
            </CardContent>
        </Card>
        
        <PromotionsBanner promotions={promotions} />
        <ProductShowcase products={sweets} chefs={chefs} title={dict.productShowcase.sweets} id="sweets" />
        <ProductShowcase products={savory} chefs={chefs} title={dict.productShowcase.savory} id="savory" />
      </div>
    </div>
  );
}
