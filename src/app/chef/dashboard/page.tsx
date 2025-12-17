'use client';
import Link from 'next/link';
import { sampleChef, products } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProductTable } from '@/components/chef/ProductTable';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChefDashboardPage() {
  const chefProducts = products.filter(p => p.chefId === sampleChef.id);
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // In a real app, you would check if the user has a 'chef' role
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="container flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="font-headline text-4xl font-bold">Chef Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back, {user.displayName}! Manage your delicious creations.</p>
        </div>
        <Button asChild>
          <Link href="/chef/products/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </div>

      <ProductTable products={chefProducts} />
    </div>
  );
}
