'use client';

import { ProductShowcase } from '@/components/product/ProductShowcase';
import { products, sampleChef, promotions } from '@/lib/data';
import type { Chef } from '@/lib/types';
import { PromotionsBanner } from '@/components/promotions/PromotionsBanner';
import { ChefShowcase } from '@/components/chef/ChefShowcase';
import { Hero } from '@/components/shared/Hero';
import { useDictionary } from '@/hooks/useDictionary';

export default function Home() {
  const dict = useDictionary();
  // In a real app, you'd fetch multiple chefs
  const chefs: Chef[] = [
      sampleChef,
      { id: 'chef-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjaGVmJTIwbWFpbnxlbnwwfHx8fDE3MTc3OTA0MDV8MA&ixlib=rb-4.0.3&q=80&w=1080', imageHint: 'chef portrait', gender: 'male' },
  ]; 

  const sweets = products.filter(p => p.type === 'pastry' || p.type === 'dessert');
  const savory = products.filter(p => p.type === 'savory');

  return (
    <div className="space-y-16">
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-16">
        <ChefShowcase chefs={chefs} />
        <PromotionsBanner promotions={promotions} />
        <ProductShowcase products={sweets} chefs={chefs} title={dict.productShowcase.sweets} id="sweets" />
        <ProductShowcase products={savory} chefs={chefs} title={dict.productShowcase.savory} id="savory" />
      </div>
    </div>
  );
}
