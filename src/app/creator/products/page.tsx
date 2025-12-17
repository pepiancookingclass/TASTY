
'use client';
import Link from 'next/link';
import { sampleCreator, products } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProductTable } from '@/components/creator/ProductTable';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDictionary } from '@/hooks/useDictionary';

export default function CreatorProductsPage() {
  const creatorProducts = products.filter(p => p.creatorId === sampleCreator.id);
  const { user, loading } = useUser();
  const router = useRouter();
  const dict = useDictionary();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  //   // In a real app, you would check if the user has a 'creator' role
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return <div className="container flex justify-center items-center h-screen"><p>{dict.loading}</p></div>;
  // }
  
  return (
    <div >
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="font-headline text-4xl font-bold">{dict.creatorProducts.title}</h1>
            <p className="text-muted-foreground mt-2">{dict.creatorProducts.description}</p>
        </div>
        <Button asChild>
          <Link href="/creator/products/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {dict.creatorProducts.addNew}
          </Link>
        </Button>
      </div>

      <ProductTable products={creatorProducts} />
    </div>
  );
}
