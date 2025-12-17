'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductCard } from './ProductCard';

interface ProductShowcaseProps {
  products: Product[];
}

type DietaryFilters = {
  isGlutenFree: boolean;
  isVegan: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
};

export function ProductShowcase({ products }: ProductShowcaseProps) {
  const [filters, setFilters] = useState<DietaryFilters>({
    isGlutenFree: false,
    isVegan: false,
    isDairyFree: false,
    isNutFree: false,
  });

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
  
  const filterOptions: { id: keyof DietaryFilters, label: string }[] = [
      { id: 'isGlutenFree', label: 'Gluten-Free' },
      { id: 'isVegan', label: 'Vegan' },
      { id: 'isDairyFree', label: 'Dairy-Free' },
      { id: 'isNutFree', label: 'Nut-Free' },
  ];

  return (
    <section>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-6">
        <h2 className="font-headline text-3xl font-bold">From Our Chefs</h2>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {filterOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox id={option.id} checked={filters[option.id]} onCheckedChange={() => handleFilterChange(option.id)} />
                    <Label htmlFor={option.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {option.label}
                    </Label>
                </div>
            ))}
        </div>
      </div>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground font-headline text-xl">No products match your filters.</p>
            <p className="text-muted-foreground mt-2">Try adjusting your selection to find more delights!</p>
        </div>
      )}
    </section>
  );
}
