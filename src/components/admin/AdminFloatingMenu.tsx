'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Clock, 
  ShoppingBag, 
  Tag, 
  Crown,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  Gift,
  Settings,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Enlaces de ADMIN
const adminLinks = [
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/creators', label: 'Todos los Creadores', icon: Users },
  { href: '/admin/creators/pending', label: 'Solicitudes Pendientes', icon: Clock },
  { href: '/admin/products', label: 'Todos los Productos', icon: ShoppingBag },
  { href: '/admin/promotions', label: 'Promociones', icon: Tag },
];

// Enlaces de CREADOR
const creatorLinks = [
  { href: '/creator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/orders', label: 'Pedidos', icon: ClipboardList },
  { href: '/creator/products', label: 'Productos', icon: ShoppingBag },
  { href: '/creator/combos', label: 'Combos', icon: Gift },
  { href: '/creator/settings', label: 'Configuración', icon: Settings },
];

export function AdminFloatingMenu() {
  const pathname = usePathname();
  const { roles, loading } = useUserRoles();
  
  // Solo mostrar si es admin o agent
  const isAdmin = roles.some(role => ['admin', 'agent'].includes(role));
  
  if (loading || !isAdmin) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full shadow-lg gap-2 bg-primary hover:bg-primary/90"
          >
            <Crown className="h-5 w-5" />
            <span className="hidden sm:inline">Admin</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Panel Admin
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <DropdownMenuItem key={link.href} asChild>
                <Link 
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    isActive && 'bg-muted font-medium'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Panel Creador
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {creatorLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <DropdownMenuItem key={link.href} asChild>
                <Link 
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    isActive && 'bg-muted font-medium'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <Home className="h-4 w-4" />
              Volver a Tienda
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
