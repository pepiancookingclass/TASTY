'use client';

import { ProductShowcase } from '@/components/product/ProductShowcase';
import { products, sampleChef, promotions } from '@/lib/data';
import type { Chef } from '@/lib/types';
import { PromotionsBanner } from '@/components/promotions/PromotionsBanner';
import { ChefShowcase } from '@/components/chef/ChefShowcase';
import { useLanguage } from '@/hooks/useLanguage';
import { Hero } from '@/components/shared/Hero';

export default function Home() {
  const { language } = useLanguage();
  // In a real app, you'd fetch multiple chefs
  const chefs: Chef[] = [
      sampleChef,
      { id: 'chef-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://picsum.photos/seed/303/100/100', imageHint: 'chef portrait', gender: 'male' },
  ]; 

  const sweets = products.filter(p => p.type === 'pastry' || p.type === 'dessert');
  const savory = products.filter(p => p.type === 'savory');

  const content = {
    en: {
      sweets: 'Sweets',
      savory: 'Savory',
    },
    es: {
      sweets: 'Dulces',
      savory: 'Salados',
    }
  }

  return (
    <div className="space-y-16">
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-16">
        <ChefShowcase chefs={chefs} />
        <PromotionsBanner promotions={promotions} />
        <ProductShowcase products={sweets} chefs={chefs} title={content[language].sweets} id="sweets" />
        <ProductShowcase products={savory} chefs={chefs} title={content[language].savory} id="savory" />
      </div>
    </div>
  );
}
