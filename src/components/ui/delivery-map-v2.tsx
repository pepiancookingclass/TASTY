'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calculator, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Importar Leaflet dinámicamente para evitar errores de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface CreatorDeliveryInfo {
  creator_id: string;
  creator_name: string;
  delivery_fee: number;
  distance_km: number;
  is_within_radius: boolean;
  creator_location?: string;
}

interface DeliveryMapV2Props {
  cartItems: Array<{
    product: {
      id: string;
      creator_id: string;
    };
    quantity: number;
  }>;
  userLocation?: { lat: number; lng: number } | null;
  onDeliveryCalculated: (deliveryInfo: CreatorDeliveryInfo[], totalDelivery: number) => void;
}

export function DeliveryMapV2({ 
  cartItems, 
  userLocation,
  onDeliveryCalculated 
}: DeliveryMapV2Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<CreatorDeliveryInfo[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6349, -90.5069]); // Guatemala City
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  // Calcular delivery cuando cambia la ubicación del usuario o los items
  useEffect(() => {
    if (userLocation && cartItems.length > 0) {
      calculateDeliveryFees();
    }
  }, [userLocation, cartItems]);

  const calculateDeliveryFees = async () => {
    if (!userLocation) return;
    
    setCalculating(true);
    setError(null);
    
    try {
      // Obtener creadores únicos del carrito
      const uniqueCreators = Array.from(new Set(cartItems.map(item => item.product.creator_id)));
      
      // Preparar datos para la función SQL
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        creator_id: item.product.creator_id,
        quantity: item.quantity
      }));

      // Llamar a la función SQL para calcular delivery
      const { data, error } = await supabase
        .rpc('calculate_order_total_delivery', {
          order_items: JSON.stringify(orderItems),
          client_latitude: userLocation.lat,
          client_longitude: userLocation.lng
        });

      if (error) throw error;

      const deliveryData: CreatorDeliveryInfo[] = data || [];
      setDeliveryInfo(deliveryData);

      // Calcular total de delivery
      const totalDelivery = deliveryData
        .filter(info => info.is_within_radius)
        .reduce((sum, info) => sum + info.delivery_fee, 0);

      // Notificar al componente padre
      onDeliveryCalculated(deliveryData, totalDelivery);

    } catch (error: any) {
      console.error('Error calculating delivery:', error);
      setError('No se pudo calcular el costo de delivery');
    } finally {
      setCalculating(false);
    }
  };

  // Actualizar centro del mapa cuando se obtiene ubicación
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando mapa...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cálculo de Delivery por Creador
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          El costo se calcula desde la ubicación de cada creador hasta tu dirección
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de cálculo */}
        {calculating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculando costos de delivery...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Información de delivery por creador */}
        {deliveryInfo.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Costos por Creador:</h4>
            {deliveryInfo.map((info) => (
              <div key={info.creator_id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{info.creator_name}</p>
                    {info.creator_location && (
                      <p className="text-xs text-muted-foreground">{info.creator_location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {info.is_within_radius ? (
                      <Badge variant="secondary">{formatPrice(info.delivery_fee)}</Badge>
                    ) : (
                      <Badge variant="destructive">Fuera de cobertura</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Distancia: {info.distance_km.toFixed(1)} km</span>
                  {!info.is_within_radius && (
                    <span className="text-destructive">Radio máximo excedido</span>
                  )}
                </div>
              </div>
            ))}

            <Separator />
            
            <div className="flex justify-between items-center font-medium">
              <span>Total Delivery:</span>
              <span className="text-lg">
                {formatPrice(
                  deliveryInfo
                    .filter(info => info.is_within_radius)
                    .reduce((sum, info) => sum + info.delivery_fee, 0)
                )}
              </span>
            </div>

            {deliveryInfo.some(info => !info.is_within_radius) && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Atención</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Algunos creadores no pueden entregar a tu ubicación. 
                  Los productos de esos creadores no estarán disponibles para este pedido.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mapa */}
        {userLocation && (
          <div className="h-64 w-full rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Marcador de ubicación del usuario */}
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <strong>Tu ubicación</strong><br />
                    Punto de entrega
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {!userLocation && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="mx-auto h-12 w-12 mb-4" />
            <p>Proporciona tu ubicación para calcular el costo de delivery</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




