'use client';

import Link from 'next/link';
import { ChefHat, Salad, ShoppingCart, User, Crown, Globe, LogOut, LogIn, UserPlus, Menu } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { useLanguage } from '@/hooks/useLanguage';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useRouter } from 'next/navigation';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useDictionary } from '@/hooks/useDictionary';

export function SiteHeader() {
  const { state } = useCart();
  const { language, setLanguage } = useLanguage();
  const { user, loading } = useUser();
  const { roles, loading: rolesLoading } = useUserRoles();
  const router = useRouter();
  const dict = useDictionary();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: dict.siteHeader.home },
    { href: '/#sweets', label: dict.siteHeader.sweets },
    { href: '/#savory', label: dict.siteHeader.savory },
    { href: '/#handmades', label: dict.siteHeader.handmades },
    { href: '/creators', label: dict.siteHeader.creators },
  ];

  const isCreator = roles.includes('creator');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        
        {/* Mobile Menu */}
        <div className="md:hidden">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex h-full flex-col">
                <div className="border-b p-4">
                  <SheetClose asChild>
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="bg-primary rounded-full p-1.5 flex items-center justify-center">
                            <ChefHat className="h-6 w-6 text-white" />
                        </div>
                        <span className="inline-block font-headline text-2xl font-bold text-primary">
                          Tasty
                        </span>
                    </Link>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-1 p-4">
                  {navLinks.map(link => (
                     <SheetClose asChild key={link.label}>
                        <Link href={link.href} className="text-lg font-medium text-foreground transition-colors hover:text-primary rounded-md p-2 hover:bg-muted">
                          {link.label}
                        </Link>
                      </SheetClose>
                  ))}
                   {!rolesLoading && isCreator && (
                     <SheetClose asChild>
                        <Link href="/creator/dashboard" className="text-lg font-medium text-foreground transition-colors hover:text-primary rounded-md p-2 hover:bg-muted">
                          {dict.siteHeader.creatorDashboard}
                        </Link>
                      </SheetClose>
                   )}
                </nav>
                <div className="mt-auto border-t p-4">
                    <SheetClose asChild>
                      <Link href="/admin/promotions" className="text-lg font-medium text-foreground transition-colors hover:text-primary rounded-md p-2 hover:bg-muted flex items-center">
                          <Crown className="mr-2 h-5 w-5" />
                          <span>{dict.siteHeader.admin}</span>
                        </Link>
                    </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex flex-1 items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary rounded-full p-1.5 flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="inline-block font-headline text-2xl font-bold text-primary">
              Tasty
            </span>
          </Link>
          <nav className="flex gap-4 items-center">
            {navLinks.map(link => (
              <Link key={link.label} href={link.href} className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
             {!rolesLoading && isCreator && (
              <Link href="/creator/dashboard" className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
                {dict.siteHeader.creatorDashboard}
              </Link>
            )}
          </nav>
        </div>

        {/* Center Logo on Mobile */}
         <div className="flex md:hidden flex-1 justify-center">
             <Link href="/" className="flex items-center space-x-2">
                <div className="bg-primary rounded-full p-1.5 flex items-center justify-center">
                    <ChefHat className="h-5 w-5 text-white" />
                </div>
                <span className="inline-block font-headline text-xl font-bold text-primary">
                Tasty
                </span>
            </Link>
         </div>


        <div className="flex items-center justify-end space-x-1">
            <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button
                variant={language === 'es' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('es')}
                className="h-auto px-2 py-0.5 text-xs"
            >
                ES
            </Button>
            <Button
                variant={language === 'en' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="h-auto px-2 py-0.5 text-xs"
            >
                EN
            </Button>
            </div>
            <Link href="/cart">
            <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                <Badge
                    variant="default"
                    className="absolute top-2 right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
                    style={{
                    backgroundColor: 'hsl(var(--accent))',
                    color: 'hsl(var(--accent-foreground))',
                    }}
                >
                    {itemCount}
                </Badge>
                )}
                <span className="sr-only">{dict.siteHeader.shoppingCart}</span>
            </Button>
            </Link>
            {loading ? null : user ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                       <AvatarFallback>{(user.displayName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/user/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>{dict.siteHeader.profile}</span>
                    </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                    <Link href="/admin/promotions">
                        <Crown className="mr-2 h-4 w-4" />
                        <span>{dict.siteHeader.admin}</span>
                    </Link>
                    </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{dict.siteHeader.logout}</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            ) : (
             <div className="flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="relative h-8 w-8">
                            <User className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/login">
                                <LogIn className="mr-2 h-4 w-4" />
                                <span>{dict.siteHeader.login}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/signup">
                                <UserPlus className="mr-2 h-4 w-4" />
                                <span>{dict.siteHeader.signup}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/admin/promotions">
                                <Crown className="mr-2 h-4 w-4" />
                                <span>{dict.siteHeader.admin}</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            )}
        </div>
      </div>
    </header>
  );
}
