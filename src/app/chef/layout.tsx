'use client';
import { ChefSidebar } from '@/components/chef/ChefSidebar';
import { OrderProvider } from '@/context/OrderProvider';

export default function ChefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrderProvider>
      <div className="flex bg-muted/40 min-h-screen">
        <ChefSidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </OrderProvider>
  );
}
