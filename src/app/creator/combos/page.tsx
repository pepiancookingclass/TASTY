'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Gift, 
  Users, 
  ShoppingBag, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Percent,
  Loader2,
  Star
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/useUser';
import { Combo } from '@/lib/types';
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

const categoryLabels = {
  'sweet_savory': 'Dulce & Salado',
  'breakfast': 'Desayuno',
  'dessert_mix': 'Mix de Postres',
  'full_meal': 'Comida Completa',
  'artisan_mix': 'Mix Artesanal'
};

export default function CreatorCombosPage() {
  const { canManageOwnProducts, loading: permissionsLoading } = usePermissions();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canManageOwnProducts) {
      router.push('/');
    }
  }, [canManageOwnProducts, permissionsLoading, router]);

  // Cargar combos del creador
  const loadCombos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Obtener combos donde el usuario es el creador principal o participante
      const { data: combosData, error: combosError } = await supabase
        .from('combos')
        .select(`
          *,
          combo_creators!inner (
            creator_id,
            creator_name,
            products_count,
            total_contribution
          )
        `)
        .or(`created_by.eq.${user.id},combo_creators.creator_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (combosError) throw combosError;

      // Obtener estadísticas adicionales
      const combosWithStats = await Promise.all(
        (combosData || []).map(async (combo) => {
          const { count: creatorsCount } = await supabase
            .from('combo_creators')
            .select('*', { count: 'exact', head: true })
            .eq('combo_id', combo.id);

          const { count: productsCount } = await supabase
            .from('combo_items')
            .select('*', { count: 'exact', head: true })
            .eq('combo_id', combo.id);

          return {
            ...combo,
            creators_count: creatorsCount || 0,
            products_count: productsCount || 0
          };
        })
      );

      setCombos(combosWithStats);
    } catch (error) {
      console.error('Error loading combos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los combos"
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar combo
  const deleteCombo = async (comboId: string) => {
    setDeletingId(comboId);
    
    try {
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', comboId);

      if (error) throw error;

      toast({
        title: "Combo eliminado",
        description: "El combo ha sido eliminado exitosamente"
      });

      loadCombos();
    } catch (error: any) {
      console.error('Error deleting combo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el combo"
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Cambiar estado activo
  const toggleComboStatus = async (comboId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('combos')
        .update({ is_active: !currentStatus })
        .eq('id', comboId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Combo ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
      });

      loadCombos();
    } catch (error: any) {
      console.error('Error updating combo status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado"
      });
    }
  };

  useEffect(() => {
    if (canManageOwnProducts && user) {
      loadCombos();
    }
  }, [canManageOwnProducts, user]);

  if (permissionsLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando combos...
        </div>
      </div>
    );
  }

  if (!canManageOwnProducts) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Mis Combos Colaborativos
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus combos y colaboraciones con otros creadores
          </p>
        </div>
        <Button asChild>
          <Link href="/creator/combos/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear Combo
          </Link>
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{combos.length}</p>
                <p className="text-sm text-muted-foreground">Total Combos</p>
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
                  {combos.filter(c => c.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {combos.reduce((sum, c) => sum + (c.creators_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Colaboraciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {combos.length > 0 
                    ? Math.round(combos.reduce((sum, c) => sum + c.discount_percentage, 0) / combos.length)
                    : 0
                  }%
                </p>
                <p className="text-sm text-muted-foreground">Descuento Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de combos */}
      {combos.length === 0 ? (
        <div className="text-center py-16">
          <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No tienes combos aún</h2>
          <p className="text-muted-foreground mb-6">
            ¡Crea tu primer combo colaborativo y aumenta tus ventas trabajando con otros creadores!
          </p>
          <Button asChild size="lg">
            <Link href="/creator/combos/new">
              <Plus className="mr-2 h-4 w-4" />
              Crear Mi Primer Combo
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map((combo) => {
            const savings = combo.original_price - combo.total_price;
            const isOwner = combo.created_by === user?.id;

            return (
              <Card key={combo.id} className="overflow-hidden">
                <div className="relative">
                  <Image
                    src={combo.image_url || '/placeholder-combo.jpg'}
                    alt={combo.name_es}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={combo.is_active ? "default" : "secondary"}>
                      {combo.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-green-600 text-white">
                      <Percent className="h-3 w-3 mr-1" />
                      -{combo.discount_percentage}%
                    </Badge>
                  </div>
                  {combo.is_featured && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-purple-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{combo.name_es}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[combo.category as keyof typeof categoryLabels]}
                      </p>
                    </div>
                    {isOwner && (
                      <Badge variant="outline" className="text-xs">
                        Organizador
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {combo.description_es}
                  </p>

                  {/* Precios */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(combo.total_price)}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(combo.original_price)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          -{formatPrice(savings)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{combo.creators_count} creadores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>{combo.products_count} productos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{Math.ceil(combo.preparation_time / 60)}h prep.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span>{combo.current_orders} pedidos</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/combos/${combo.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
                    {isOwner && (
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/creator/combos/${combo.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                    )}
                  </div>

                  {isOwner && (
                    <div className="flex gap-2">
                      <Button 
                        variant={combo.is_active ? "secondary" : "default"}
                        size="sm" 
                        className="flex-1"
                        onClick={() => toggleComboStatus(combo.id, combo.is_active)}
                      >
                        {combo.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={deletingId === combo.id}
                          >
                            {deletingId === combo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar combo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres eliminar "{combo.name_es}"? 
                              Esta acción no se puede deshacer y afectará a todos los creadores colaboradores.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteCombo(combo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Información sobre combos */}
      <Card className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">
              ¿Cómo funcionan los Combos Colaborativos?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-purple-700">
              <div className="text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium mb-1">1. Colabora</p>
                <p>Invita a otros creadores a unirse a tu combo</p>
              </div>
              <div className="text-center">
                <Gift className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium mb-1">2. Combina</p>
                <p>Crea ofertas atractivas con productos complementarios</p>
              </div>
              <div className="text-center">
                <Percent className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium mb-1">3. Gana Más</p>
                <p>Aumenta tus ventas y llega a nuevos clientes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
