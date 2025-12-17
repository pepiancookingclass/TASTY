'use client';
import { ChefSidebar } from '@/components/chef/ChefSidebar';

export default function ChefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-muted/40 min-h-screen">
      <ChefSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
