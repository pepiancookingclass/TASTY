'use client';

import { useState, useMemo } from 'react';
import { Product, Creator } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductCard } from './ProductCard';
import { useDictionary } from '@/hooks/useDictionary';

interface ProductShowcaseProps {
  products: Product[];
  creators: Creator[];
  title: string;
  id: string;
}

type DietaryFilters = {
  isGlutenFree: boolean;
  isVegan: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
};

export function ProductShowcase({ products, creators, title, id }: ProductShowcaseProps) {
  const isHandmadeSection = id === 'handmades' || id === 'handcrafts' || id === 'handmade';
  const [filters, setFilters] = useState<DietaryFilters>({
    isGlutenFree: false,
    isVegan: false,
    isDairyFree: false,
    isNutFree: false,
  });
  const dict = useDictionary();

  const handleFilterChange = (filterName: keyof DietaryFilters) => {
    setFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.type === 'handmade') {
        return true;
      }
      return (
        (!filters.isGlutenFree || product.dietaryFlags.isGlutenFree) &&
        (!filters.isVegan || product.dietaryFlags.isVegan) &&
        (!filters.isDairyFree || product.dietaryFlags.isDairyFree) &&
        (!filters.isNutFree || product.dietaryFlags.isNutFree)
      );
    });
  }, [products, filters]);
  
  const filterOptions: { id: keyof DietaryFilters, label: string }[] = [
      { id: 'isGlutenFree', label: dict.productShowcase.filters.glutenFree },
      { id: 'isVegan', label: dict.productShowcase.filters.vegan },
      { id: 'isDairyFree', label: dict.productShowcase.filters.dairyFree },
      { id: 'isNutFree', label: dict.productShowcase.filters.nutFree },
  ];

  return (
    <section id={id}>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-6">
        <h2 className="font-headline text-3xl font-bold">{title}</h2>
        {!isHandmadeSection && (
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {filterOptions.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox id={`${id}-${option.id}`} checked={filters[option.id]} onCheckedChange={() => handleFilterChange(option.id)} />
                      <Label htmlFor={`${id}-${option.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {option.label}
                      </Label>
                  </div>
              ))}
          </div>
        )}
      </div>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => {
            const creator = creators.find(c => c.id === product.creatorId);
            return <ProductCard key={product.id} product={product} creator={creator} />
          })}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground font-headline text-xl">
              {dict.productShowcase.noProductsMatch}
            </p>
            <p className="text-muted-foreground mt-2">
              {dict.productShowcase.tryAdjusting}
            </p>
        </div>
      )}
    </section>
  );
}
