'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, ClipboardList, ShoppingBag, Gift, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';

const navItems = [
  { href: '/creator/dashboard', label: 'dashboard', icon: BarChart },
  { href: '/creator/orders', label: 'orders', icon: ClipboardList },
  { href: '/creator/products', label: 'products', icon: ShoppingBag },
  { href: '/creator/combos', label: 'combos', icon: Gift },
  { href: '/', label: 'backToStore', icon: Home },
];

export function CreatorBottomNav() {
  const pathname = usePathname();
  const dict = useDictionary();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = item.href === '/' 
            ? false 
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                isActive 
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="truncate max-w-[60px]">
                {dict.creatorSidebar[item.label as keyof typeof dict.creatorSidebar]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
