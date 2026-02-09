'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Star,
  DollarSign,
  Package,
  Loader2,
  User
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
import Image from 'next/image';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Product {
  id: string;
  name_es: string;
  description_es: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
  created_at: string;
  creator_id: string;
  creator_name: string;
  creator_email: string;
}

export default function AdminProductsPage() {
  const { canAccessAdminPanel, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const t = dict.admin.products;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canAccessAdminPanel) {
      router.push('/');
    }
  }, [canAccessAdminPanel, permissionsLoading, router]);

  // Cargar productos
  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          users!creator_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const formattedProducts = (productsData || []).map(product => ({
        ...product,
        creator_name: product.users?.name || 'Sin nombre',
        creator_email: product.users?.email || 'Sin email'
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los productos"
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto
  const deleteProduct = async (productId: string) => {
    setDeletingId(productId);
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente"
      });

      loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el producto"
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Cambiar disponibilidad
  const toggleAvailability = async (productId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentAvailability })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Disponibilidad actualizada",
        description: `Producto ${!currentAvailability ? 'activado' : 'desactivado'} exitosamente`
      });

      loadProducts();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la disponibilidad"
      });
    }
  };

  useEffect(() => {
    if (canAccessAdminPanel) {
      loadProducts();
    }
  }, [canAccessAdminPanel]);

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name_es.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description_es.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    const matchesAvailability = 
      availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && product.is_available) ||
      (availabilityFilter === 'unavailable' && !product.is_available);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (permissionsLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando productos...
        </div>
      </div>
    );
  }

  if (!canAccessAdminPanel) {
    return null;
  }

  const categories = [...new Set(products.map(p => p.category))];
  const availableCount = products.filter(p => p.is_available).length;
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Gestionar Productos
          </h1>
          <p className="text-muted-foreground">
            Administra todos los productos de la plataforma
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Total Productos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{availableCount}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{formatPrice(totalValue / products.length || 0)}</p>
                <p className="text-sm text-muted-foreground">Precio Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(products.map(p => p.creator_id)).size}
                </p>
                <p className="text-sm text-muted-foreground">Creadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos o creadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="available">Disponibles</SelectItem>
            <SelectItem value="unavailable">No disponibles</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => {
          setSearchTerm('');
          setCategoryFilter('all');
          setAvailabilityFilter('all');
        }}>
          <Filter className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="relative">
              <Image
                src={product.image_url || '/placeholder-product.jpg'}
                alt={product.name_es}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={product.is_available ? "default" : "secondary"}>
                  {product.is_available ? "Disponible" : "No disponible"}
                </Badge>
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-white/90">
                  {product.category}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{product.name_es}</CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(product.price)}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description_es}
              </p>

              {/* Información del creador */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{product.creator_name}</p>
                <p className="text-xs text-muted-foreground">{product.creator_email}</p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/products/${product.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t?.view ?? "Ver"}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t?.edit ?? "Editar"}
                  </Link>
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant={product.is_available ? "secondary" : "default"}
                  size="sm" 
                  className="flex-1"
                  onClick={() => toggleAvailability(product.id, product.is_available)}
                >
                  {product.is_available ? (t?.deactivate ?? 'Desactivar') : (t?.activate ?? 'Activar')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={deletingId === product.id}
                    >
                      {deletingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t?.deleteDialogTitle ?? "¿Eliminar producto?"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t?.deleteDialogDesc
                          ? t.deleteDialogDesc(product.name_es)
                          : `¿Estás seguro de que quieres eliminar "${product.name_es}"? Esta acción no se puede deshacer.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t?.deleteCancel ?? "Cancelar"}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteProduct(product.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t?.deleteConfirm ?? "Eliminar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t?.emptyTitle ?? "No se encontraron productos"}</h2>
          <p className="text-muted-foreground mb-6">
            {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all'
              ? (t?.emptySearch ?? 'Intenta ajustar los filtros de búsqueda')
              : (t?.emptyDesc ?? 'Aún no hay productos registrados en la plataforma')
            }
          </p>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              {t?.emptyCta ?? "Crear Primer Producto"}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}




