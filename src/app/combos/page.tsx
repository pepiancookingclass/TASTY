'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Star,
  ShoppingBag,
  Sparkles,
  Gift,
  ChefHat,
  Timer,
  Percent,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Combo } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoryLabels = {
  'sweet_savory': 'Dulce & Salado',
  'breakfast': 'Desayuno',
  'dessert_mix': 'Mix de Postres',
  'full_meal': 'Comida Completa',
  'artisan_mix': 'Mix Artesanal'
};

export default function CombosPage() {
  const { toast } = useToast();
  const { trackPageView } = useAnalytics();
  
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Cargar combos
  const loadCombos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_active_combos', {
          category_filter: categoryFilter === 'all' ? null : categoryFilter,
          limit_count: 50,
          offset_count: 0
        });

      if (error) throw error;
      setCombos(data || []);
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

  useEffect(() => {
    trackPageView('combos');
    loadCombos();
  }, [categoryFilter]);

  // Filtrar y ordenar combos
  const filteredCombos = combos
    .filter(combo => 
      combo.name_es.toLowerCase().includes(searchTerm.toLowerCase()) ||
      combo.description_es.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_low':
          return a.total_price - b.total_price;
        case 'price_high':
          return b.total_price - a.total_price;
        case 'discount':
          return b.discount_percentage - a.discount_percentage;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const featuredCombos = filteredCombos.filter(combo => combo.is_featured);
  const regularCombos = filteredCombos.filter(combo => !combo.is_featured);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando combos...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
            <Gift className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Combos Colaborativos
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Descubre deliciosas combinaciones creadas por nuestros creadores trabajando juntos. 
          ¡Lo mejor de varios mundos en un solo pedido!
        </p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar combos..."
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
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Destacados</SelectItem>
            <SelectItem value="newest">Más recientes</SelectItem>
            <SelectItem value="price_low">Precio: menor a mayor</SelectItem>
            <SelectItem value="price_high">Precio: mayor a menor</SelectItem>
            <SelectItem value="discount">Mayor descuento</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => {
          setSearchTerm('');
          setCategoryFilter('all');
          setSortBy('featured');
        }}>
          <Filter className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>

      {/* Combos Destacados */}
      {featuredCombos.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Combos Destacados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} featured />
            ))}
          </div>
        </div>
      )}

      {/* Todos los Combos */}
      {regularCombos.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Todos los Combos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        </div>
      )}

      {filteredCombos.length === 0 && (
        <div className="text-center py-16">
          <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No se encontraron combos</h2>
          <p className="text-muted-foreground mb-6">
            {searchTerm || categoryFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Aún no hay combos disponibles'
            }
          </p>
          <Button asChild>
            <Link href="/creators">
              <ChefHat className="mr-2 h-4 w-4" />
              Ver Creadores
            </Link>
          </Button>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-16">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <span className="text-lg font-semibold text-purple-900">¿Eres creador?</span>
            </div>
            <p className="text-purple-700 mb-6 max-w-2xl mx-auto">
              ¡Colabora con otros creadores y crea combos únicos! 
              Aumenta tus ventas y ofrece experiencias gastronómicas completas.
            </p>
            <Button asChild size="lg">
              <Link href="/creator/dashboard">
                Crear Combo Colaborativo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente para mostrar cada combo
function ComboCard({ combo, featured = false }: { combo: Combo; featured?: boolean }) {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  const savings = combo.original_price - combo.total_price;

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${featured ? 'ring-2 ring-purple-200' : ''}`}>
      {featured && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2">
          <div className="flex items-center justify-center gap-2">
            <Star className="h-4 w-4" />
            <span className="text-sm font-semibold">COMBO DESTACADO</span>
          </div>
        </div>
      )}
      
      <div className="relative">
        <Image
          src={combo.image_url || '/placeholder-combo.jpg'}
          alt={combo.name_es}
          width={400}
          height={250}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-green-600 text-white">
            <Percent className="h-3 w-3 mr-1" />
            -{combo.discount_percentage}%
          </Badge>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-white/90">
            {categoryLabels[combo.category as keyof typeof categoryLabels]}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{combo.name_es}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {combo.description_es}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Precios */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(combo.total_price)}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground line-through">
                {formatPrice(combo.original_price)}
              </p>
              <Badge variant="secondary" className="text-xs">
                Ahorras {formatPrice(savings)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Información del combo */}
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
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span>
              {combo.available_until 
                ? `Hasta ${new Date(combo.available_until).toLocaleDateString()}`
                : 'Siempre disponible'
              }
            </span>
          </div>
        </div>

        {/* Límite de pedidos */}
        {combo.max_orders && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">
                ¡Oferta limitada! {combo.max_orders - combo.current_orders} disponibles
              </span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(combo.current_orders / combo.max_orders) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Botón de acción */}
        <Button asChild className="w-full">
          <Link href={`/combos/${combo.id}`}>
            Ver Detalles del Combo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
