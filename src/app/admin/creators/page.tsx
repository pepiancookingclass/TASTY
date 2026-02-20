'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ShoppingBag,
  Star,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Loader2
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
import Image from 'next/image';
import Link from 'next/link';
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

interface Creator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_picture_url?: string;
  instagram?: string;
  skills: string[];
  address_city?: string;
  address_state?: string;
  has_delivery: boolean;
  availability_status: 'available' | 'vacation' | 'busy';
  created_at: string;
  product_count?: number;
  total_orders?: number;
}

export default function AdminCreatorsPage() {
  const { canAccessAdminPanel, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const t = dict.admin.creators;
  
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canAccessAdminPanel) {
      router.push('/');
    }
  }, [canAccessAdminPanel, permissionsLoading, router]);

  // Cargar creadores
  const loadCreators = async () => {
    try {
      setLoading(true);
      
      // Obtener usuarios con rol de creator
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('users')
        .select('*')
        .contains('roles', ['creator'])
        .order('created_at', { ascending: false });

      if (creatorsError) throw creatorsError;

      // Obtener estadísticas de cada creador
      const creatorsWithStats = await Promise.all(
        (creatorsData || []).map(async (creator) => {
          // Contar productos
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', creator.id);

          // Contar pedidos (aproximado)
          const { count: orderCount } = await supabase
            .from('order_items')
            .select('order_id', { count: 'exact', head: true })
            .in('product_id', 
              (await supabase
                .from('products')
                .select('id')
                .eq('creator_id', creator.id)
              ).data?.map(p => p.id) || []
            );

          return {
            ...creator,
            availability_status: creator.availability_status || 'available',
            product_count: productCount || 0,
            total_orders: orderCount || 0
          };
        })
      );

      setCreators(creatorsWithStats);
    } catch (error) {
      console.error('Error loading creators:', error);
      toast({
        variant: "destructive",
        title: t?.loadErrorTitle ?? "Error",
        description: t?.loadErrorDesc ?? "No se pudieron cargar los creadores"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de disponibilidad del creador
  const updateAvailabilityStatus = async (creatorId: string, newStatus: 'available' | 'vacation' | 'busy') => {
    setUpdatingStatusId(creatorId);
    
    try {
      console.log('🔄 Updating availability_status:', { creatorId, newStatus });
      
      const { error, data } = await supabase
        .from('users')
        .update({ availability_status: newStatus })
        .eq('id', creatorId)
        .select();

      console.log('📝 Update result:', { error, data });
      
      if (error) throw error;

      // Actualizar estado local
      setCreators(prev => prev.map(c => 
        c.id === creatorId ? { ...c, availability_status: newStatus } : c
      ));

      const statusLabels = {
        available: t?.statusAvailable ?? "Disponible",
        vacation: t?.statusVacation ?? "Vacaciones",
        busy: t?.statusBusy ?? "Muchos pedidos"
      };

      toast({
        title: t?.statusUpdated ?? "Estado actualizado",
        description: `${statusLabels[newStatus]}`
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo cambiar el estado"
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Eliminar creador
  const deleteCreator = async (creatorId: string) => {
    setDeletingId(creatorId);
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', creatorId);

      if (error) throw error;

      toast({
        title: t?.deleteTitle ?? "Creador eliminado",
        description: t?.deleteDesc ?? "El creador ha sido eliminado exitosamente"
      });

      loadCreators();
    } catch (error: any) {
      console.error('Error deleting creator:', error);
      toast({
        variant: "destructive",
        title: t?.deleteErrorTitle ?? "Error",
        description: error.message || (t?.deleteErrorDesc ?? "No se pudo eliminar el creador")
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (canAccessAdminPanel) {
      loadCreators();
    }
  }, [canAccessAdminPanel]);

  // Filtrar creadores
  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.address_city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (permissionsLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          {t?.loading ?? "Cargando creadores..."}
        </div>
      </div>
    );
  }

  if (!canAccessAdminPanel) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            {t?.title ?? "Gestionar Creadores"}
          </h1>
          <p className="text-muted-foreground">
            {t?.subtitle ?? "Administra todos los creadores de la plataforma"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/creators/new">
            <Plus className="mr-2 h-4 w-4" />
            {t?.ctaNew ?? "Nuevo Creador"}
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{creators.length}</p>
                <p className="text-sm text-muted-foreground">{t?.stats?.totalCreators ?? "Total Creadores"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {creators.reduce((sum, c) => sum + (c.product_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t?.stats?.totalProducts ?? "Total Productos"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {creators.filter(c => c.has_delivery).length}
                </p>
                <p className="text-sm text-muted-foreground">{t?.stats?.withDelivery ?? "Con Delivery"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(creators.map(c => c.address_city).filter(Boolean)).size}
                </p>
                <p className="text-sm text-muted-foreground">{t?.stats?.cities ?? "Ciudades"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t?.searchPlaceholder ?? "Buscar creadores por nombre, email o ciudad..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de creadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Image
                  src={creator.profile_picture_url || '/placeholder-avatar.jpg'}
                  alt={creator.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{creator.name}</CardTitle>
                    {creator.availability_status === 'vacation' && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        🏖️ {t?.statusVacation ?? "Vacaciones"}
                      </Badge>
                    )}
                    {creator.availability_status === 'busy' && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                        📦 {t?.statusBusy ?? "Muchos pedidos"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {creator.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Información de contacto */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{creator.email}</span>
                </div>
                {creator.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{creator.phone}</span>
                  </div>
                )}
                {creator.instagram && (
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <span>@{creator.instagram}</span>
                  </div>
                )}
                {creator.address_city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{creator.address_city}, {creator.address_state}</span>
                  </div>
                )}
              </div>

              {/* Estadísticas */}
              <div className="flex justify-between text-sm bg-gray-50 rounded-lg p-3">
                <div className="text-center">
                  <p className="font-semibold">{creator.product_count}</p>
                <p className="text-muted-foreground">{t?.cardProducts ?? "Productos"}</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{creator.total_orders}</p>
                  <p className="text-muted-foreground">{t?.cardOrders ?? "Pedidos"}</p>
                </div>
                <div className="text-center">
                  <Badge variant={creator.has_delivery ? "default" : "secondary"}>
                  {creator.has_delivery ? (t?.cardDeliveryYes ?? "Delivery") : (t?.cardDeliveryNo ?? "Sin delivery")}
                  </Badge>
                </div>
              </div>

              {/* Selector de Estado */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                <Button
                  variant={creator.availability_status === 'available' ? "default" : "outline"}
                  size="sm"
                  className={creator.availability_status === 'available' ? "bg-green-600 hover:bg-green-700 text-xs px-1" : "text-xs px-1"}
                  disabled={updatingStatusId === creator.id}
                  onClick={() => updateAvailabilityStatus(creator.id, 'available')}
                >
                  {updatingStatusId === creator.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✅'}
                </Button>
                <Button
                  variant={creator.availability_status === 'vacation' ? "default" : "outline"}
                  size="sm"
                  className={creator.availability_status === 'vacation' ? "bg-amber-500 hover:bg-amber-600 text-xs px-1" : "text-xs px-1"}
                  disabled={updatingStatusId === creator.id}
                  onClick={() => updateAvailabilityStatus(creator.id, 'vacation')}
                >
                  🏖️
                </Button>
                <Button
                  variant={creator.availability_status === 'busy' ? "default" : "outline"}
                  size="sm"
                  className={creator.availability_status === 'busy' ? "bg-orange-500 hover:bg-orange-600 text-xs px-1" : "text-xs px-1"}
                  disabled={updatingStatusId === creator.id}
                  onClick={() => updateAvailabilityStatus(creator.id, 'busy')}
                >
                  📦
                </Button>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/creators/${creator.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t?.view ?? "Ver"}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/creators/${creator.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t?.edit ?? "Editar"}
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={deletingId === creator.id}
                    >
                      {deletingId === creator.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t?.confirmDeleteTitle ?? "¿Eliminar creador?"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t?.confirmDeleteDesc
                          ? t.confirmDeleteDesc
                          : `¿Estás seguro de que quieres eliminar a ${creator.name}? Esta acción eliminará también todos sus productos y no se puede deshacer.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t?.deleteCancel ?? "Cancelar"}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteCreator(creator.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t?.delete ?? "Eliminar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCreators.length === 0 && (
        <div className="text-center py-16">
          <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t?.emptyTitle ?? "No se encontraron creadores"}</h2>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? (t?.emptySearch ?? 'Intenta con otros términos de búsqueda')
              : (t?.emptyDesc ?? 'Aún no hay creadores registrados en la plataforma')
            }
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/admin/creators/new">
                <Plus className="mr-2 h-4 w-4" />
                {t?.emptyCta ?? "Crear Primer Creador"}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}




