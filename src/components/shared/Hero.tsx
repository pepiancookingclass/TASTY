'use client';

import { Button } from '../ui/button';
import Link from 'next/link';
import { useDictionary } from '@/hooks/useDictionary';

export function Hero() {
  const dict = useDictionary();

  return (
    <div
      className="relative h-[60vh] min-h-[400px] w-full bg-cover bg-center"
      style={{ backgroundImage: "url('https://picsum.photos/seed/401/1600/900')" }}
      data-ai-hint="food platter"
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <h1 className="font-headline text-4xl font-bold md:text-6xl">
          {dict.hero.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl">
          {dict.hero.subheadline}
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/#sweets">{dict.hero.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
