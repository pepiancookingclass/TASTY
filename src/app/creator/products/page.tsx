'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProductTable } from '@/components/creator/ProductTable';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/providers/auth-provider';
import { useProductsByCreator } from '@/hooks/useProducts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDictionary } from '@/hooks/useDictionary';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreatorProductsPage() {
  const { user, loading: userLoading } = useUser();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const dict = useDictionary();
  
  // Cargar productos del creador actual
  const { products: creatorProducts, loading: productsLoading } = useProductsByCreator(authUser?.id || '');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div>
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

      {productsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : creatorProducts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-2">{dict.creatorProducts.emptyTitle}</p>
          <p className="text-muted-foreground mb-4">{dict.creatorProducts.emptyDesc}</p>
          <Button asChild>
            <Link href="/creator/products/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {dict.creatorProducts.emptyCta}
            </Link>
          </Button>
        </div>
      ) : (
        <ProductTable products={creatorProducts} />
      )}
    </div>
  );
}
