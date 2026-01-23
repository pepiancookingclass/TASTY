'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useDictionary } from '@/hooks/useDictionary';

interface CategoryBase {
  id: 'dulce' | 'salado' | 'handcrafts' | 'season' | 'otros';
  slug: string;
  image: string;
  emoji: string;
  gradient: string;
}

// Imágenes desde Supabase Storage
const SUPABASE_STORAGE_URL = 'https://aitmxnfljglwpkpibgek.supabase.co/storage/v1/object/public/images/categories';

const categoriesBase: CategoryBase[] = [
  {
    id: 'dulce',
    slug: 'dulce',
    image: `${SUPABASE_STORAGE_URL}/dulce.jpg`,
    emoji: '🍰',
    gradient: 'from-pink-400 via-rose-400 to-red-400'
  },
  {
    id: 'salado',
    slug: 'salado',
    image: `${SUPABASE_STORAGE_URL}/salado.jpg`,
    emoji: '🥘',
    gradient: 'from-amber-400 via-orange-400 to-red-500'
  },
  {
    id: 'handcrafts',
    slug: 'handcrafts',
    image: `${SUPABASE_STORAGE_URL}/handcraft.jpg`, // Sin 's' al final
    emoji: '🎨',
    gradient: 'from-violet-400 via-purple-400 to-fuchsia-500'
  },
  {
    id: 'season',
    slug: 'season',
    image: `${SUPABASE_STORAGE_URL}/season.jpg`,
    emoji: '🎉',
    gradient: 'from-amber-400 via-pink-400 to-purple-500'
  },
  {
    id: 'otros',
    slug: 'otros',
    image: `${SUPABASE_STORAGE_URL}/otros.jpeg`, // .jpeg no .jpg
    emoji: '✨',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-500'
  }
];

export function CategoryCarousel() {
  const dict = useDictionary();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (categoryId: string) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: true }));
  };

  return (
    <div className="w-full py-6 bg-gradient-to-b from-secondary/30 to-background">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 px-4">
        {dict.categoryCarousel.title}
      </h2>
      
      {/* Carrusel horizontal para móvil, centrado en desktop */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-4 min-w-max md:justify-center">
          {categoriesBase.map((category) => {
            const categoryName = dict.categories[category.id].name;
            
            return (
              <Link
                key={category.id}
                href={`/products/${category.slug}`}
                className="group flex-shrink-0"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-active:scale-95">
                  {/* Fondo con gradiente */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`}>
                    {/* Solo cargar imagen si existe URL */}
                    {category.image && !imageErrors[category.id] && (
                      <Image
                        src={category.image}
                        alt={categoryName}
                        fill
                        className="object-cover"
                        onError={() => handleImageError(category.id)}
                      />
                    )}
                  </div>
                  
                  {/* Emoji como visual principal (o fallback si imagen falla) */}
                  {(!category.image || imageErrors[category.id]) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl drop-shadow-lg">
                        {category.emoji}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay para texto legible */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Nombre de categoría */}
                  <div className="absolute inset-0 flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-xs sm:text-sm text-center px-1 drop-shadow-lg">
                      {categoryName}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Indicador de scroll en móvil */}
      <div className="flex justify-center mt-2 md:hidden">
        <span className="text-xs text-muted-foreground animate-pulse">
          {dict.categoryCarousel.swipeHint}
        </span>
      </div>
    </div>
  );
}
