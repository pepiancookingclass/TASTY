'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowLeft, Edit, Loader2, Package, Clock, DollarSign } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { getProductById } from '@/lib/services/products';
import { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { canAccessAdminPanel, loading: permissionsLoading } = usePermissions();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  useEffect(() => {
    if (!permissionsLoading && !canAccessAdminPanel) {
      router.push('/');
    }
  }, [permissionsLoading, canAccessAdminPanel, router]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        const data = await getProductById(productId);
        if (!data) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Producto no encontrado',
          });
          router.push('/admin/products');
          return;
        }
        setProduct(data);
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar el producto',
        });
      } finally {
        setLoading(false);
      }
    };

    if (canAccessAdminPanel) {
      loadProduct();
    }
  }, [productId, canAccessAdminPanel, router, toast]);

  if (permissionsLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessAdminPanel || !product) {
    return null;
  }

  const typeLabels: Record<string, string> = {
    pastry: 'Pastelería',
    dessert: 'Postres',
    savory: 'Salados',
    cookie: 'Galletas',
    handmade: 'Artesanal',
    seasonal: 'Temporada',
    other: 'Otros',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/products">Productos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name.es}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 flex justify-between items-center">
        <Button variant="ghost" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Producto
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden">
            <Image
              src={product.imageUrl || '/placeholder-product.jpg'}
              alt={product.name.es}
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge>{typeLabels[product.type] || product.type}</Badge>
              {product.isSoldOut && (
                <Badge variant="destructive">No disponible</Badge>
              )}
            </div>
          </div>

          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.imageUrls.slice(0, 4).map((url, idx) => (
                <Image
                  key={idx}
                  src={url}
                  alt={`${product.name.es} - ${idx + 1}`}
                  width={150}
                  height={100}
                  className="w-full h-20 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name.es}</h1>
            <p className="text-muted-foreground text-lg">{product.name.en}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(product.price)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span>{product.preparationTime}h preparación</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Español:</p>
                <p>{product.description.es || 'Sin descripción'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">English:</p>
                <p>{product.description.en || 'No description'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingredientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Español:</p>
                <p>{product.ingredients.es || 'Sin ingredientes listados'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">English:</p>
                <p>{product.ingredients.en || 'No ingredients listed'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Dietética</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.dietaryFlags.isGlutenFree && (
                  <Badge variant="outline">Sin Gluten</Badge>
                )}
                {product.dietaryFlags.isVegan && (
                  <Badge variant="outline">Vegano</Badge>
                )}
                {product.dietaryFlags.isDairyFree && (
                  <Badge variant="outline">Sin Lácteos</Badge>
                )}
                {product.dietaryFlags.isNutFree && (
                  <Badge variant="outline">Sin Frutos Secos</Badge>
                )}
                {!product.dietaryFlags.isGlutenFree &&
                  !product.dietaryFlags.isVegan &&
                  !product.dietaryFlags.isDairyFree &&
                  !product.dietaryFlags.isNutFree && (
                    <span className="text-muted-foreground">
                      Sin restricciones dietéticas especificadas
                    </span>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>
                  {product.deliveryVehicle === 'auto'
                    ? '🚗 Auto (productos grandes/frágiles)'
                    : '🏍️ Moto (productos pequeños/medianos)'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
