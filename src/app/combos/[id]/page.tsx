'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Clock, 
  Users, 
  Star,
  ShoppingBag,
  Gift,
  ChefHat,
  Timer,
  Percent,
  Loader2,
  Heart,
  Share2,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCart } from '@/hooks/useCart';
import { ComboDetails } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ComboDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { trackPageView } = useAnalytics();
  const { dispatch } = useCart();
  
  const [combo, setCombo] = useState<ComboDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const comboId = params.id as string;

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Cargar detalles del combo
  const loadComboDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_combo_details', { combo_uuid: comboId });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Combo no encontrado",
          description: "El combo que buscas no existe o no está disponible"
        });
        router.push('/combos');
        return;
      }

      // Procesar los datos para crear la estructura ComboDetails
      const firstRow = data[0];
      const comboData: ComboDetails = {
        id: firstRow.combo_id,
        name_es: firstRow.combo_name_es,
        description_es: firstRow.combo_description_es,
        image_url: firstRow.combo_image,
        category: firstRow.combo_category,
        total_price: firstRow.combo_total_price,
        original_price: firstRow.combo_original_price,
        discount_percentage: firstRow.combo_discount,
        is_active: true,
        is_featured: false,
        available_from: '',
        current_orders: 0,
        preparation_time: 120,
        created_at: '',
        created_by: '',
        items: [],
        creators: []
      };

      // Procesar items y creadores
      const itemsMap = new Map();
      const creatorsMap = new Map();

      data.forEach(row => {
        // Agregar item si no existe
        if (!itemsMap.has(row.product_id)) {
          itemsMap.set(row.product_id, {
            id: `${row.combo_id}-${row.product_id}`,
            combo_id: row.combo_id,
            product_id: row.product_id,
            creator_id: row.creator_id,
            quantity: row.product_quantity,
            individual_price: row.product_price,
            creator_percentage: 90,
            product: {
              id: row.product_id,
              name: { es: row.product_name_es, en: row.product_name_es },
              imageUrl: row.product_image,
              price: row.product_price
            }
          });
        }

        // Agregar creador si no existe
        if (!creatorsMap.has(row.creator_id)) {
          creatorsMap.set(row.creator_id, {
            id: `${row.combo_id}-${row.creator_id}`,
            combo_id: row.combo_id,
            creator_id: row.creator_id,
            creator_name: row.creator_name,
            creator_avatar: row.creator_avatar,
            products_count: 1,
            total_contribution: row.product_price * row.product_quantity,
            revenue_percentage: 0
          });
        } else {
          const creator = creatorsMap.get(row.creator_id);
          creator.products_count += 1;
          creator.total_contribution += row.product_price * row.product_quantity;
        }
      });

      comboData.items = Array.from(itemsMap.values());
      comboData.creators = Array.from(creatorsMap.values());

      setCombo(comboData);
      trackPageView('combo_detail', comboId);
    } catch (error) {
      console.error('Error loading combo details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los detalles del combo"
      });
    } finally {
      setLoading(false);
    }
  };

  // Agregar combo al carrito (convertir a productos individuales)
  const addToCart = async () => {
    if (!combo) return;
    
    setAddingToCart(true);
    try {
      // Agregar cada producto del combo al carrito
      combo.items.forEach(item => {
        if (item.product) {
          dispatch({ 
            type: 'ADD_ITEM', 
            payload: {
              id: item.product.id,
              name: item.product.name,
              price: item.individual_price,
              imageUrl: item.product.imageUrl || '/placeholder-product.jpg',
              type: 'pastry',
              description: { es: '', en: '' },
              ingredients: { es: '', en: '' },
              creatorId: item.creator_id,
              preparationTime: combo.preparation_time / 60,
              dietaryFlags: {
                isGlutenFree: false,
                isVegan: false,
                isDairyFree: false,
                isNutFree: false
              },
              imageHint: ''
            }
          });
        }
      });

      toast({
        title: "¡Combo agregado!",
        description: `${combo.name_es} ha sido agregado a tu carrito`
      });
    } catch (error) {
      console.error('Error adding combo to cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el combo al carrito"
      });
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    if (comboId) {
      loadComboDetails();
    }
  }, [comboId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando combo...
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Combo no encontrado</h2>
          <p className="text-muted-foreground mb-6">
            El combo que buscas no existe o no está disponible
          </p>
          <Button asChild>
            <Link href="/combos">
              Volver a Combos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const savings = combo.original_price - combo.total_price;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navegación */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/combos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Combos
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Imagen principal */}
        <div className="space-y-4">
          <div className="relative">
            <Image
              src={combo.image_url || '/placeholder-combo.jpg'}
              alt={combo.name_es}
              width={600}
              height={400}
              className="w-full h-96 object-cover rounded-lg"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-green-600 text-white">
                <Percent className="h-3 w-3 mr-1" />
                -{combo.discount_percentage}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Información principal */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{combo.name_es}</h1>
            <p className="text-lg text-muted-foreground">{combo.description_es}</p>
          </div>

          {/* Precios */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(combo.total_price)}
              </span>
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(combo.original_price)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Ahorras {formatPrice(savings)}
              </Badge>
              <Badge variant="outline">
                {combo.discount_percentage}% de descuento
              </Badge>
            </div>
          </div>

          {/* Información del combo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{combo.creators.length} creadores colaborando</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <span>{combo.items.length} productos incluidos</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>{Math.ceil(combo.preparation_time / 60)} horas de preparación</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-muted-foreground" />
              <span>Combo colaborativo</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-4">
            <Button 
              onClick={addToCart} 
              disabled={addingToCart}
              size="lg" 
              className="w-full"
            >
              {addingToCart ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar al Carrito
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Heart className="mr-2 h-4 w-4" />
                Favorito
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Creadores colaboradores */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Creadores Colaboradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combo.creators.map((creator) => (
              <div key={creator.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={creator.creator_avatar} alt={creator.creator_name} />
                  <AvatarFallback>{creator.creator_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{creator.creator_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {creator.products_count} producto{creator.products_count > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    {formatPrice(creator.total_contribution)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productos incluidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Productos Incluidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {combo.items.map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Image
                    src={item.product?.imageUrl || '/placeholder-product.jpg'}
                    alt={item.product?.name.es || 'Producto'}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product?.name.es}</h4>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.quantity}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {formatPrice(item.individual_price * item.quantity)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Por</p>
                    <p className="font-medium">
                      {combo.creators.find(c => c.creator_id === item.creator_id)?.creator_name}
                    </p>
                  </div>
                </div>
                {index < combo.items.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total del combo:</span>
            <span className="text-green-600">{formatPrice(combo.total_price)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




