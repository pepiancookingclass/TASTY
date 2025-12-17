import { ProductShowcase } from '@/components/product/ProductShowcase';
import { PromotionsBanner } from '@/components/promotions/PromotionsBanner';
import { products, promotions } from '@/lib/data';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PromotionsBanner promotions={promotions} />
      <ProductShowcase products={products} />
    </div>
  );
}
