'use client';

import Link from 'next/link';
import { ChefHat, Salad, ShoppingCart, User, Crown, Globe, LogOut, LogIn } from 'lucide-react';
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
import { useLanguage } from '@/hooks/useLanguage';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useRouter } from 'next/navigation';

export function SiteHeader() {
  const { state } = useCart();
  const { language, toggleLanguage } = useLanguage();
  const { user, loading } = useUser();
  const router = useRouter();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = {
    en: {
      sweets: 'Sweets',
      savory: 'Savory',
      chefs: 'Chefs',
    },
    es: {
      sweets: 'Dulces',
      savory: 'Salados',
      chefs: 'Chefs',
    },
  };
  
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="inline-block font-headline text-2xl font-bold">
              Tasty Home
            </span>
          </Link>
          <nav className="hidden md:flex gap-4">
            <Link href="/#sweets" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {navLinks[language].sweets}
            </Link>
            <Link href="/#savory" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {navLinks[language].savory}
            </Link>
            <Link href="/chefs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {navLinks[language].chefs}
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-1">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={toggleLanguage}>
              <Globe className="h-5 w-5" />
              <span className="sr-only">Change language</span>
            </Button>
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
                <span className="sr-only">Shopping Cart</span>
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
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {/* In a real app, you would conditionally render these based on user roles */}
                  <DropdownMenuItem asChild>
                    <Link href="/chef/dashboard">
                      <ChefHat className="mr-2 h-4 w-4" />
                      <span>Chef Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/promotions">
                      <Crown className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
