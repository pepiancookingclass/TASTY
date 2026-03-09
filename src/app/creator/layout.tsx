'use client';
import { CreatorSidebar } from '@/components/creator/CreatorSidebar';
import { CreatorBottomNav } from '@/components/creator/CreatorBottomNav';
import { OrderProvider } from '@/context/OrderProvider';
import { AnimatedSwan } from '@/components/AnimatedSwan';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading } = useUser();
  const { roles, loading: rolesLoading } = useUserRoles();
  const router = useRouter();

  const isLoading = userLoading || rolesLoading;
  const canAccess = roles.some(role => ['creator', 'admin', 'agent'].includes(role));

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!canAccess) {
        router.push('/');
      }
    }
  }, [user, canAccess, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <AnimatedSwan size={72} />
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <AnimatedSwan size={72} />
      </div>
    );
  }

  return (
    <OrderProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
            <CreatorSidebar />
        </div>
        <div className="flex flex-col">
            <main className="flex flex-1 flex-col gap-4 p-4 pb-20 md:pb-6 lg:gap-6 lg:p-6">
              {children}
            </main>
        </div>
      </div>
      {/* Bottom navigation for mobile - todos lo usan */}
      <CreatorBottomNav />
    </OrderProvider>
  );
}
