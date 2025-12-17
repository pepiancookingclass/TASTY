'use client';

import { useState, useMemo } from 'react';
import { Product, Chef } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductCard } from './ProductCard';
import { useLanguage } from '@/hooks/useLanguage';

interface ProductShowcaseProps {
  products: Product[];
  chefs: Chef[];
  title: string;
  id: string;
}

type DietaryFilters = {
  isGlutenFree: boolean;
  isVegan: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
};

export function ProductShowcase({ products, chefs, title, id }: ProductShowcaseProps) {
  const [filters, setFilters] = useState<DietaryFilters>({
    isGlutenFree: false,
    isVegan: false,
    isDairyFree: false,
    isNutFree: false,
  });
  const { language } = useLanguage();

  const handleFilterChange = (filterName: keyof DietaryFilters) => {
    setFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      return (
        (!filters.isGlutenFree || product.dietaryFlags.isGlutenFree) &&
        (!filters.isVegan || product.dietaryFlags.isVegan) &&
        (!filters.isDairyFree || product.dietaryFlags.isDairyFree) &&
        (!filters.isNutFree || product.dietaryFlags.isNutFree)
      );
    });
  }, [products, filters]);
  
  const filterOptions: { id: keyof DietaryFilters, label: string, es_label: string }[] = [
      { id: 'isGlutenFree', label: 'Gluten-Free', es_label: 'Sin Gluten' },
      { id: 'isVegan', label: 'Vegan', es_label: 'Vegano' },
      { id: 'isDairyFree', label: 'Dairy-Free', es_label: 'Sin Lactosa' },
      { id: 'isNutFree', label: 'Nut-Free', es_label: 'Sin Nueces' },
  ];

  return (
    <section id={id}>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-6">
        <h2 className="font-headline text-3xl font-bold">{title}</h2>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {filterOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox id={`${id}-${option.id}`} checked={filters[option.id]} onCheckedChange={() => handleFilterChange(option.id)} />
                    <Label htmlFor={`${id}-${option.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {language === 'es' ? option.es_label : option.label}
                    </Label>
                </div>
            ))}
        </div>
      </div>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => {
            const chef = chefs.find(c => c.id === product.chefId);
            return <ProductCard key={product.id} product={product} chef={chef} />
          })}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground font-headline text-xl">
              {language === 'es' ? 'No hay productos que coincidan con tus filtros.' : 'No products match your filters.'}
            </p>
            <p className="text-muted-foreground mt-2">
              {language === 'es' ? '¡Intenta ajustar tu selección para encontrar más delicias!' : 'Try adjusting your selection to find more delights!'}
            </p>
        </div>
      )}
    </section>
  );
}
