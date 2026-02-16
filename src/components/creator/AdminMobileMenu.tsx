'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Clock, ShoppingBag, Tag, Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Solo enlaces de ADMIN (no creador)
const adminLinks = [
  { href: '/admin/analytics', label: 'analytics', icon: BarChart3 },
  { href: '/admin/creators', label: 'allCreators', icon: Users },
  { href: '/admin/creators/pending', label: 'pendingCreators', icon: Clock },
  { href: '/admin/products', label: 'allProducts', icon: ShoppingBag },
  { href: '/admin/promotions', label: 'promotions', icon: Tag },
];

export function AdminMobileMenu() {
  const pathname = usePathname();
  const dict = useDictionary();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            <span className="text-xs font-medium">Admin</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">Panel Admin</h2>
              <p className="text-xs text-muted-foreground">Opciones administrativas</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {adminLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const Icon = link.icon;
                
                return (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                        isActive 
                          ? 'bg-primary text-primary-foreground font-medium' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {dict.creatorSidebar[link.label as keyof typeof dict.creatorSidebar]}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-medium text-muted-foreground">Panel Creador</span>
      <div className="w-16" /> {/* Spacer */}
    </div>
  );
}
