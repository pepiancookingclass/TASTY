'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Clock, 
  Star, 
  ShoppingBag, 
  Percent,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  Timer
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos de ejemplo de ofertas (en producción vendrían de la base de datos)
const sampleOffers = [
  {
    id: '1',
    title: 'Descuento del 20% en Postres',
    description: 'Todos los postres de María Dulces con 20% de descuento',
    discount: 20,
    type: 'percentage',
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
    creatorName: 'María Dulces',
    creatorAvatar: '/placeholder-avatar.jpg',
    category: 'Postres',
    minOrder: 50,
    maxDiscount: 25,
    usedCount: 45,
    maxUses: 100,
    image: '/placeholder-product.jpg',
    featured: true
  },
  {
    id: '2',
    title: 'Combo Familiar Salado',
    description: 'Lleva 3 productos salados y paga solo 2',
    discount: 33,
    type: 'combo',
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
    creatorName: 'Cocina de Ana',
    creatorAvatar: '/placeholder-avatar.jpg',
    category: 'Salados',
    minOrder: 0,
    maxDiscount: 0,
    usedCount: 12,
    maxUses: 50,
    image: '/placeholder-product.jpg',
    featured: false
  },
  {
    id: '3',
    title: 'Primera Compra - 15% OFF',
    description: '15% de descuento en tu primera compra con cualquier creador',
    discount: 15,
    type: 'first_time',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    creatorName: 'Todos los Creadores',
    creatorAvatar: '/placeholder-avatar.jpg',
    category: 'General',
    minOrder: 30,
    maxDiscount: 20,
    usedCount: 156,
    maxUses: 500,
    image: '/placeholder-product.jpg',
    featured: true
  },
  {
    id: '4',
    title: 'Artesanías Especiales',
    description: 'Envío gratis en artesanías por compras mayores a Q100',
    discount: 0,
    type: 'free_shipping',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    creatorName: 'Manos Creativas',
    creatorAvatar: '/placeholder-avatar.jpg',
    category: 'Artesanías',
    minOrder: 100,
    maxDiscount: 0,
    usedCount: 8,
    maxUses: 25,
    image: '/placeholder-product.jpg',
    featured: false
  }
];

const formatPrice = (price: number) => 
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

const getOfferTypeIcon = (type: string) => {
  switch (type) {
    case 'percentage': return Percent;
    case 'combo': return Gift;
    case 'first_time': return Star;
    case 'free_shipping': return ShoppingBag;
    default: return Gift;
  }
};

const getOfferTypeLabel = (type: string) => {
  switch (type) {
    case 'percentage': return 'Descuento';
    case 'combo': return 'Combo';
    case 'first_time': return 'Primera Compra';
    case 'free_shipping': return 'Envío Gratis';
    default: return 'Oferta';
  }
};

const getTimeRemaining = (validUntil: Date) => {
  const now = new Date();
  const days = differenceInDays(validUntil, now);
  const hours = differenceInHours(validUntil, now) % 24;
  
  if (days > 0) {
    return `${days} día${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`;
  } else {
    return 'Expira pronto';
  }
};

export default function OffersPage() {
  const [offers, setOffers] = useState(sampleOffers);
  const [filter, setFilter] = useState<'all' | 'featured' | 'ending_soon'>('all');

  const filteredOffers = offers.filter(offer => {
    if (filter === 'featured') return offer.featured;
    if (filter === 'ending_soon') {
      const hoursRemaining = differenceInHours(offer.validUntil, new Date());
      return hoursRemaining <= 48;
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Ofertas Especiales
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Descubre increíbles descuentos y promociones de nuestros creadores locales
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="flex items-center gap-2"
        >
          <Gift className="h-4 w-4" />
          Todas las Ofertas
        </Button>
        <Button
          variant={filter === 'featured' ? 'default' : 'outline'}
          onClick={() => setFilter('featured')}
          className="flex items-center gap-2"
        >
          <Star className="h-4 w-4" />
          Destacadas
        </Button>
        <Button
          variant={filter === 'ending_soon' ? 'default' : 'outline'}
          onClick={() => setFilter('ending_soon')}
          className="flex items-center gap-2"
        >
          <Timer className="h-4 w-4" />
          Terminan Pronto
        </Button>
      </div>

      {/* Grid de ofertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredOffers.map((offer) => {
          const TypeIcon = getOfferTypeIcon(offer.type);
          const progress = (offer.usedCount / offer.maxUses) * 100;
          const isEndingSoon = differenceInHours(offer.validUntil, new Date()) <= 48;
          
          return (
            <Card key={offer.id} className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${offer.featured ? 'ring-2 ring-purple-200' : ''}`}>
              {offer.featured && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-semibold">OFERTA DESTACADA</span>
                  </div>
                </div>
              )}
              
              <div className="relative">
                <Image
                  src={offer.image}
                  alt={offer.title}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className={`${offer.featured ? 'bg-purple-600' : 'bg-green-600'} text-white`}>
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {getOfferTypeLabel(offer.type)}
                  </Badge>
                </div>
                {isEndingSoon && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="destructive" className="animate-pulse">
                      <Clock className="h-3 w-3 mr-1" />
                      ¡Termina pronto!
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{offer.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{offer.description}</p>
                  </div>
                  {offer.discount > 0 && (
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-lg font-bold ml-4">
                      -{offer.discount}%
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información del creador */}
                <div className="flex items-center gap-3">
                  <Image
                    src={offer.creatorAvatar}
                    alt={offer.creatorName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{offer.creatorName}</p>
                    <p className="text-xs text-muted-foreground">{offer.category}</p>
                  </div>
                </div>

                {/* Detalles de la oferta */}
                <div className="space-y-2 text-sm">
                  {offer.minOrder > 0 && (
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>Compra mínima: {formatPrice(offer.minOrder)}</span>
                    </div>
                  )}
                  {offer.maxDiscount > 0 && (
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span>Descuento máximo: {formatPrice(offer.maxDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Válida hasta: {format(offer.validUntil, "dd 'de' MMMM", { locale: es })}</span>
                  </div>
                </div>

                {/* Progreso de uso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usos disponibles</span>
                    <span className="font-medium">{offer.maxUses - offer.usedCount} de {offer.maxUses}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {getTimeRemaining(offer.validUntil)}
                  </p>
                </div>

                {/* Botón de acción */}
                <Button asChild className="w-full">
                  <Link href={`/creators/${offer.creatorName.toLowerCase().replace(/\s+/g, '-')}`}>
                    Ver Productos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-16">
          <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No hay ofertas disponibles</h2>
          <p className="text-muted-foreground mb-6">
            {filter === 'featured' 
              ? 'No hay ofertas destacadas en este momento'
              : filter === 'ending_soon'
              ? 'No hay ofertas que terminen pronto'
              : 'Vuelve pronto para ver nuevas ofertas'
            }
          </p>
          <Button asChild>
            <Link href="/">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Explorar Productos
            </Link>
          </Button>
        </div>
      )}

      {/* Call to action */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-semibold text-purple-900">¡Únete a nuestra comunidad!</span>
          </div>
          <p className="text-purple-700 mb-6 max-w-2xl mx-auto">
            Sé el primero en conocer sobre nuevas ofertas, productos exclusivos y descuentos especiales 
            de nuestros increíbles creadores locales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Crear Cuenta Gratis
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/creators">
                Conocer Creadores
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
