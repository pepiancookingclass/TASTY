'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Tag, BarChart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';

const navLinks = [
  { href: '/chef/dashboard', label: 'dashboard', icon: BarChart },
  { href: '/chef/orders', label: 'orders', icon: ClipboardList },
  { href: '/chef/products', label: 'products', icon: ShoppingBag },
  { href: '/chef/promotions', label: 'promotions', icon: Tag },
];

export function ChefSidebar() {
  const pathname = usePathname();
  const dict = useDictionary();

  return (
    <aside className="w-64 h-screen sticky top-0 bg-background border-r p-4 flex-col hidden md:flex">
      <div className="flex items-center gap-2 mb-8 px-2">
        <h2 className="font-headline text-2xl font-bold">{dict.chefSidebar.title}</h2>
      </div>
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive && 'bg-muted text-primary font-semibold'
              )}
            >
              <link.icon className="h-4 w-4" />
              {dict.chefSidebar[link.label as keyof typeof dict.chefSidebar]}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Link href="/"
           className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
            <Home className="h-4 w-4" />
            {dict.chefSidebar.backToStore}
        </Link>
      </div>
    </aside>
  );
}
