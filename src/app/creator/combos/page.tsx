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
import { useDictionary } from '@/hooks/useDictionary';
import { Separator } from '@/components/ui/separator';

const categoryLabels = {
  'sweet_savory': { es: 'Dulce & Salado', en: 'Sweet & Savory' },
  'breakfast': { es: 'Desayuno', en: 'Breakfast' },
  'dessert_mix': { es: 'Mix de Postres', en: 'Dessert Mix' },
  'full_meal': { es: 'Comida Completa', en: 'Full Meal' },
  'artisan_mix': { es: 'Mix Artesanal', en: 'Artisan Mix' }
};

// Placeholder embebido para evitar 400 si falta la imagen
const COMBO_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f472b6"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="32" font-weight="600">
        Combo
      </text>
    </svg>`
  );

export default function CreatorCombosPage() {
  const { canManageOwnProducts, loading: permissionsLoading } = usePermissions();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const userId = user?.uid;
  console.log('🟣 CombosPage: render', { userId, permissionsLoading, canManageOwnProducts });
  
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
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
    if (!userId) {
      console.warn('⚠️ Combos: sin user.id, se omite carga');
      return;
    }
    
    try {
      setLoading(true);
      setHasError(false);
      console.log('🔄 Combos: cargando combos para usuario', userId);
      
      // Query 1: combos donde es creador (sin depender de combo_creators)
      const { data: ownedCombos, error: ownedError } = await supabase
        .from('combos')
        .select(`
          *,
          combo_creators (
            creator_id,
            creator_name,
            products_count,
            total_contribution
          )
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (ownedError) {
        console.error('❌ Combos: error en query owned', ownedError);
        throw ownedError;
      }

      // Query 2: combos donde participa en combo_creators
      const { data: participantCombos, error: participantError } = await supabase
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
        .eq('combo_creators.creator_id', userId)
        .order('created_at', { ascending: false });

      if (participantError) {
        console.error('❌ Combos: error en query participant', participantError);
        throw participantError;
      }

      const allCombos = [...(ownedCombos || []), ...(participantCombos || [])];

      // deduplicar por id
      const uniqueCombos = Array.from(new Map(allCombos.map(c => [c.id, c])).values());

      console.log('✅ Combos: recibidos', uniqueCombos.length, uniqueCombos);

      // Obtener estadísticas adicionales
      const combosWithStats = await Promise.all(
        (uniqueCombos || []).map(async (combo) => {
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
      console.log('✅ Combos: con stats', combosWithStats.length, combosWithStats);
    } catch (error) {
      console.error('❌ Combos: error cargando combos', error);
      toast({
        variant: "destructive",
        title: dict.creatorCombos.errorTitle,
        description: dict.creatorCombos.errorDesc
      });
      setHasError(true);
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
    console.log('🟣 CombosPage: useEffect permisos/usuario', { canManageOwnProducts, permissionsLoading, userId });
    if (canManageOwnProducts && userId) {
      loadCombos();
    }
  }, [canManageOwnProducts, userId]);

  if (permissionsLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          {dict.creatorCombos.loading}
        </div>
        {hasError && (
          <div className="text-center text-sm text-red-600 mt-4">
            {dict.creatorCombos.errorDesc}
          </div>
        )}
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
            {dict.creatorCombos.title}
          </h1>
          <p className="text-muted-foreground">
            {dict.creatorCombos.subtitle}
          </p>
        </div>
        <Button asChild>
          <Link href="/creator/combos/new">
            <Plus className="mr-2 h-4 w-4" />
            {dict.creatorCombos.create}
          </Link>
        </Button>
      </div>

      {hasError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {dict.creatorCombos.errorDesc}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{combos.length}</p>
                <p className="text-sm text-muted-foreground">{dict.creatorCombos.title}</p>
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
                <p className="text-sm text-muted-foreground">{dict.creatorCombos.isActive}</p>
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
                <p className="text-sm text-muted-foreground">{dict.creatorCombos.participants}</p>
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
                <p className="text-sm text-muted-foreground">{dict.creatorCombos.avgDiscount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de combos */}
      {combos.length === 0 ? (
        <div className="text-center py-16">
          <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{dict.creatorCombos.empty}</h2>
          <p className="text-muted-foreground mb-6">
            {dict.creatorCombos.subtitle}
          </p>
          <Button asChild size="lg">
            <Link href="/creator/combos/new">
              <Plus className="mr-2 h-4 w-4" />
              {dict.creatorCombos.create}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map((combo) => {
            const savings = combo.original_price - combo.total_price;
            const isOwner = combo.created_by === userId;

            return (
              <Card key={combo.id} className="overflow-hidden">
                <div className="relative">
                  <Image
                    src={combo.image_url || COMBO_PLACEHOLDER}
                    alt={combo.name_es}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={combo.is_active ? "default" : "secondary"}>
                      {combo.is_active ? dict.creatorCombos.isActive : dict.creatorCombos.isInactive}
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
                      {dict.creatorCombos.featuredBadge}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{combo.name_es}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[combo.category as keyof typeof categoryLabels]?.[dict.language === 'en' ? 'en' : 'es'] || combo.category}
                      </p>
                    </div>
                    {isOwner && (
                      <Badge variant="outline" className="text-xs">
                        {dict.creatorCombos.organizerBadge}
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
                            {dict.creatorCombos.savings(formatPrice(savings))}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{combo.creators_count} {dict.creatorCombos.participants}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>{combo.products_count} {dict.creatorCombos.products}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{Math.ceil(combo.preparation_time / 60)}h prep.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span>{combo.current_orders} {dict.creatorCombos.orders}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/combos/${combo.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {dict.creatorCombos.view}
                      </Link>
                    </Button>
                    {isOwner && (
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/creator/combos/${combo.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          {dict.creatorCombos.edit}
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
                        {combo.is_active ? dict.creatorCombos.toggleOff : dict.creatorCombos.toggleOn}
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
                            <AlertDialogTitle>{dict.creatorCombos.deleteConfirmTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {dict.creatorCombos.deleteConfirmDesc}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{dict.privacySettings.confirmCancel}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteCombo(combo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {dict.creatorCombos.delete}
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
