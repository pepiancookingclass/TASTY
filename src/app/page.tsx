'use client';

import { ProductShowcase } from '@/components/product/ProductShowcase';
import { products, sampleChef, promotions } from '@/lib/data';
import type { Chef } from '@/lib/types';
import { PromotionsBanner } from '@/components/promotions/PromotionsBanner';

export default function Home() {
  // In a real app, you'd fetch multiple chefs
  const chefs: Chef[] = [
      sampleChef,
      { id: 'chef-002', name: 'Alain Savory', email: 'alain.s@tastyapp.com', profilePictureUrl: 'https://picsum.photos/seed/303/100/100', imageHint: 'chef portrait' },
  ]; 

  const sweets = products.filter(p => p.type === 'pastry' || p.type === 'dessert');
  const savory = products.filter(p => p.type === 'savory');

  const content = {
    en: {
      sweets: 'Sweets',
      savory: 'Savory',
      handmade: 'Handmade Delights'
    },
    es: {
      sweets: 'Dulces',
      savory: 'Salados',
      handmade: 'Delicias Hechas a Mano'
    }
  }
  
  // For now, let's assume all products are "handmade" for this section.
  const handmadeProducts = products;

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      <PromotionsBanner promotions={promotions} />
      <ProductShowcase products={sweets} chefs={chefs} title="Dulces" id="sweets" />
      <ProductShowcase products={savory} chefs={chefs} title="Salados" id="savory" />
      <ProductShowcase products={handmadeProducts} chefs={chefs} title="Hecho a Mano" id="handmade" />
    </div>
  );
}
