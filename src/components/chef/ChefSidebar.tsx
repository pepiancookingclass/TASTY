'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Tag, BarChart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

const navLinks = [
  { href: '/chef/dashboard', label: 'Dashboard', es_label: 'Dashboard', icon: BarChart },
  { href: '/chef/orders', label: 'Orders', es_label: 'Pedidos', icon: ClipboardList },
  { href: '/chef/products', label: 'Products', es_label: 'Productos', icon: ShoppingBag },
  { href: '/chef/promotions', label: 'Promotions', es_label: 'Promociones', icon: Tag },
];

export function ChefSidebar() {
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <aside className="w-64 h-screen sticky top-0 bg-background border-r p-4 flex-col hidden md:flex">
      <div className="flex items-center gap-2 mb-8 px-2">
        {/* You can add a chef-specific logo or title here */}
        <h2 className="font-headline text-2xl font-bold">Chef Portal</h2>
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
              {language === 'es' ? link.es_label : link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Link href="/"
           className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
            <Home className="h-4 w-4" />
            Back to Store
        </Link>
      </div>
    </aside>
  );
}
