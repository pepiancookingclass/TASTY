'use client';
import Link from 'next/link';
import { sampleChef, products } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProductTable } from '@/components/chef/ProductTable';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDictionary } from '@/hooks/useDictionary';

export default function ChefProductsPage() {
  const chefProducts = products.filter(p => p.chefId === sampleChef.id);
  const { user, loading } = useUser();
  const router = useRouter();
  const dict = useDictionary();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  //   // In a real app, you would check if the user has a 'chef' role
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div className="container flex justify-center items-center h-screen"><p>{dict.loading}</p></div>;
  // }
  
  return (
    <div >
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="font-headline text-4xl font-bold">{dict.chefProducts.title}</h1>
            <p className="text-muted-foreground mt-2">{dict.chefProducts.description}</p>
        </div>
        <Button asChild>
          <Link href="/chef/products/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {dict.chefProducts.addNew}
          </Link>
        </Button>
      </div>

      <ProductTable products={chefProducts} />
    </div>
  );
}
