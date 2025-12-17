'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '../ui/button';
import Link from 'next/link';

export function Hero() {
  const { language } = useLanguage();

  const content = {
    en: {
      headline: 'Artisan Flavors, Straight From Home',
      subheadline: 'Discover unique, handcrafted dishes made with passion by local chefs.',
      cta: 'Explore Now',
    },
    es: {
      headline: 'Sabores Artesanales, Directo de Casa',
      subheadline:
        'Descubre platillos únicos, hechos a mano con pasión por chefs locales.',
      cta: 'Explora Ahora',
    },
  };

  return (
    <div
      className="relative h-[60vh] min-h-[400px] w-full bg-cover bg-center"
      style={{ backgroundImage: "url('https://picsum.photos/seed/401/1600/900')" }}
      data-ai-hint="food platter"
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <h1 className="font-headline text-4xl font-bold md:text-6xl">
          {content[language].headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl">
          {content[language].subheadline}
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/#sweets">{content[language].cta}</Link>
        </Button>
      </div>
    </div>
  );
}
