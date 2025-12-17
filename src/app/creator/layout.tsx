'use client';
import { CreatorSidebar } from '@/components/creator/CreatorSidebar';
import { OrderProvider } from '@/context/OrderProvider';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrderProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
            <CreatorSidebar />
        </div>
        <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                  <div className="border-b p-4">
                      <Link href="/creator/dashboard" className="flex items-center space-x-2">
                          <div className="bg-primary rounded-full p-1.5 flex items-center justify-center">
                              <ChefHat className="h-6 w-6 text-white" />
                          </div>
                          <span className="inline-block font-headline text-2xl font-bold text-primary">
                            Tasty
                          </span>
                      </Link>
                  </div>
                  <CreatorSidebar isMobile={true} />
                </SheetContent>
              </Sheet>
              <div className="w-full flex-1">
                 {/* Can add search or other header items here */}
              </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
        </div>
      </div>
    </OrderProvider>
  );
}
