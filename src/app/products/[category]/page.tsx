'use client';

import { useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCreators } from '@/hooks/useCreators';
import { ProductShowcase } from '@/components/product/ProductShowcase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { useDictionary } from '@/hooks/useDictionary';

// Configuración de categorías (solo tipos y emojis, nombres vienen del diccionario)
const categoryConfig: Record<string, {
  types: string[];
  emoji: string;
}> = {
  dulce: {
    types: ['pastry', 'dessert', 'cookie'],
    emoji: '🍰'
  },
  salado: {
    types: ['savory'],
    emoji: '🥘'
  },
  handcrafts: {
    types: ['handmade'],
    emoji: '🎨'
  },
  otros: {
    types: [], // Todos los que no están en las otras categorías
    emoji: '✨'
  }
};

type CategoryKey = 'dulce' | 'salado' | 'handcrafts' | 'otros';

export default function CategoryProductsPage() {
  const params = useParams();
  const category = params.category as string;
  const dict = useDictionary();
  const { products, loading: productsLoading } = useProducts();
  const { creators, loading: creatorsLoading } = useCreators();

  const config = categoryConfig[category];
  const isValidCategory = category in categoryConfig && category in dict.categories;

  // Si la categoría no existe
  if (!config || !isValidCategory) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{dict.categoryPage.notFound}</h1>
        <p className="text-muted-foreground mb-6">
          {dict.categoryPage.notFoundHint}
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {dict.categoryPage.backButton}
          </Link>
        </Button>
      </div>
    );
  }

  // Obtener traducciones de la categoría
  const categoryData = dict.categories[category as CategoryKey];

  // Filtrar productos por categoría
  const filteredProducts = category === 'otros'
    ? products.filter(p => !['pastry', 'dessert', 'cookie', 'savory', 'handmade'].includes(p.type))
    : products.filter(p => config.types.includes(p.type));

  const isLoading = productsLoading || creatorsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-4 text-white hover:text-white hover:bg-white/20"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dict.categoryPage.backButton}
            </Link>
          </Button>
          
          <div className="flex items-center gap-4">
            <span className="text-5xl">{config.emoji}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{categoryData.name}</h1>
              <p className="text-white/90 mt-1">{categoryData.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {dict.categoryPage.noProducts}
            </h2>
            <p className="text-muted-foreground mb-6">
              {dict.categoryPage.noProductsHint}
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {dict.categoryPage.exploreOther}
              </Link>
            </Button>
          </div>
        ) : (
          <ProductShowcase 
            products={filteredProducts} 
            creators={creators} 
            title={dict.categoryPage.productsAvailable(filteredProducts.length)}
            id={category}
          />
        )}
      </div>
    </div>
  );
}
