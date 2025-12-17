'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Tag, BarChart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/hooks/useDictionary';
import { SheetClose } from '../ui/sheet';

const navLinks = [
  { href: '/chef/dashboard', label: 'dashboard', icon: BarChart },
  { href: '/chef/orders', label: 'orders', icon: ClipboardList },
  { href: '/chef/products', label: 'products', icon: ShoppingBag },
  { href: '/chef/promotions', label: 'promotions', icon: Tag },
];

interface ChefSidebarProps {
  isMobile?: boolean;
}

export function ChefSidebar({ isMobile = false }: ChefSidebarProps) {
  const pathname = usePathname();
  const dict = useDictionary();

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
        {dict.chefSidebar[label as keyof typeof dict.chefSidebar]}
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
              <h2 className="font-headline text-2xl font-bold">{dict.chefSidebar.title}</h2>
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
              {dict.chefSidebar.backToStore}
          </Link>
        </div>
      )}
    </Wrapper>
  );
}
