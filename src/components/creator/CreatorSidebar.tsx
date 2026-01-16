
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Tag, BarChart, ClipboardList, Users, Settings, Crown, BarChart3, Gift, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';
import { usePermissions } from '@/hooks/usePermissions';
import { SheetClose } from '../ui/sheet';

// Enlaces para CREADORES (solo sus propios productos)
const creatorLinks = [
  { href: '/creator/dashboard', label: 'dashboard', icon: BarChart },
  { href: '/creator/orders', label: 'orders', icon: ClipboardList },
  { href: '/creator/products', label: 'products', icon: ShoppingBag },
  { href: '/creator/combos', label: 'combos', icon: Gift },
  { href: '/creator/promotions', label: 'promotions', icon: Tag },
  { href: '/creator/settings', label: 'settings', icon: Settings },
];

// Enlaces adicionales para ADMIN/AGENT (gestionar todos los creadores)
const adminLinks = [
  { href: '/admin/analytics', label: 'analytics', icon: BarChart3 },
  { href: '/admin/creators', label: 'allCreators', icon: Users },
  { href: '/admin/creators/pending', label: 'pendingCreators', icon: Clock },
  { href: '/admin/products', label: 'allProducts', icon: ShoppingBag },
  { href: '/admin/offers', label: 'allOffers', icon: Tag },
  { href: '/admin/settings', label: 'settings', icon: Settings },
];

interface CreatorSidebarProps {
  isMobile?: boolean;
}

export function CreatorSidebar({ isMobile = false }: CreatorSidebarProps) {
  const pathname = usePathname();
  const dict = useDictionary();
  const { canAccessAdminPanel, isCreator, isAdmin, isAgent } = usePermissions();

  // Determinar qué enlaces mostrar según el rol
  const getNavLinks = () => {
    let links = [...creatorLinks];
    
    // Si es admin o agente, agregar enlaces administrativos
    if (canAccessAdminPanel) {
      links = [...links, ...adminLinks];
    }
    
    return links;
  };

  const navLinks = getNavLinks();

  const NavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: React.ElementType}) => {
    const isActive = pathname.startsWith(href);
    const linkContent = (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-muted text-primary font-semibold'
        )}
      >
        <Icon className="h-4 w-4" />
        {dict.creatorSidebar[label as keyof typeof dict.creatorSidebar]}
      </Link>
    );

    if (isMobile) {
      return <SheetClose asChild>{linkContent}</SheetClose>;
    }
    return linkContent;
  };

  const Wrapper = isMobile ? 'nav' : 'aside';
  const wrapperProps = isMobile 
    ? { className: "flex-grow overflow-auto p-4" }
    : { className: "flex h-full max-h-screen flex-col gap-2" };

  return (
    <Wrapper {...wrapperProps}>
      {!isMobile && (
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
           <div className="flex items-center gap-2 font-semibold">
              {canAccessAdminPanel ? (
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <h2 className="font-headline text-2xl font-bold">
                    {isAdmin ? 'Admin Panel' : 'Panel Agente'}
                  </h2>
                </div>
              ) : (
                <h2 className="font-headline text-2xl font-bold">{dict.creatorSidebar.title}</h2>
              )}
           </div>
        </div>
      )}
      
      <div className={cn(!isMobile && "flex-1")}>
        <nav className={cn("grid items-start text-sm font-medium", isMobile ? "gap-2" : "px-2 lg:px-4 py-4")}>
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
            />
          ))}
        </nav>
      </div>

      {!isMobile && (
        <div className="mt-auto p-4">
          <Link href="/"
             className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
              <Home className="h-4 w-4" />
              {dict.creatorSidebar.backToStore}
          </Link>
        </div>
      )}
    </Wrapper>
  );
}
