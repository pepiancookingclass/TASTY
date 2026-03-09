'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AdminNewProductForm } from '@/components/admin/AdminNewProductForm';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AnimatedSwan } from '@/components/AnimatedSwan';

export default function AdminNewProductPage() {
  const { canAccessAdminPanel, loading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !canAccessAdminPanel) {
      router.push('/');
    }
  }, [loading, canAccessAdminPanel, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-64 gap-3">
        <AnimatedSwan size={64} />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!canAccessAdminPanel) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/products">Productos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Nuevo Producto</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="font-headline text-4xl font-bold mb-2">Crear Nuevo Producto</h1>
      <p className="text-muted-foreground mb-8">Completa los detalles para agregar un nuevo producto.</p>

      <AdminNewProductForm />
    </div>
  );
}
