import { ProductShowcase } from '@/components/product/ProductShowcase';
import { ChefShowcase } from '@/components/chef/ChefShowcase';
import { products, sampleChef } from '@/lib/data';

export default function Home() {
  // In a real app, you'd fetch multiple chefs
  const chefs = [sampleChef]; 
  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      <ChefShowcase chefs={chefs} />
      <ProductShowcase products={products} />
    </div>
  );
}
