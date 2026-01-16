'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calculator, Loader2 } from 'lucide-react';

// Importar Leaflet dinámicamente para evitar errores de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Zonas de delivery en Guatemala con coordenadas y tarifas
const DELIVERY_ZONES = {
  'Guatemala': {
    center: [14.6349, -90.5069],
    municipalities: {
      'Guatemala': { coords: [14.6349, -90.5069], fee: 15 },
      'Mixco': { coords: [14.6308, -90.6067], fee: 20 },
      'Villa Nueva': { coords: [14.5256, -90.5881], fee: 25 },
      'Petapa': { coords: [14.5019, -90.5581], fee: 25 },
      'San José Pinula': { coords: [14.5456, -90.4089], fee: 30 },
      'Chinautla': { coords: [14.7081, -90.4981], fee: 25 },
      'Amatitlán': { coords: [14.4833, -90.6167], fee: 35 },
      'Villa Canales': { coords: [14.4667, -90.5333], fee: 30 }
    }
  },
  'Sacatepéquez': {
    center: [14.5586, -90.7314],
    municipalities: {
      'Antigua Guatemala': { coords: [14.5586, -90.7314], fee: 40 },
      'Jocotenango': { coords: [14.5731, -90.7406], fee: 45 },
      'San Lucas Sacatepéquez': { coords: [14.6089, -90.6531], fee: 35 },
      'Santiago Sacatepéquez': { coords: [14.6333, -90.7167], fee: 40 },
      'Ciudad Vieja': { coords: [14.5167, -90.7667], fee: 45 }
    }
  }
};

interface DeliveryMapProps {
  selectedDepartment?: string;
  selectedMunicipality?: string;
  userLocation?: { lat: number; lng: number } | null;
  onDeliveryFeeCalculated?: (fee: number, distance?: number) => void;
}

export function DeliveryMap({ 
  selectedDepartment, 
  selectedMunicipality, 
  userLocation,
  onDeliveryFeeCalculated 
}: DeliveryMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(15);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6349, -90.5069]); // Guatemala City

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calcular tarifa de delivery
  const calculateDeliveryFee = () => {
    if (!selectedDepartment || !selectedMunicipality) {
      return 15; // Tarifa base
    }

    const zone = DELIVERY_ZONES[selectedDepartment as keyof typeof DELIVERY_ZONES];
    if (!zone) return 15;

    const municipality = zone.municipalities[selectedMunicipality as keyof typeof zone.municipalities];
    if (!municipality) return 15;

    let baseFee = municipality.fee;

    // Si tenemos geolocalización del usuario, calcular distancia exacta
    if (userLocation) {
      const distanceKm = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        municipality.coords[0],
        municipality.coords[1]
      );
      
      setDistance(distanceKm);
      
      // Ajustar tarifa por distancia (Q2 por km adicional después de 5km)
      if (distanceKm > 5) {
        baseFee += Math.ceil((distanceKm - 5) * 2);
      }
    }

    return baseFee;
  };

  // Actualizar tarifa cuando cambian los datos
  useEffect(() => {
    const fee = calculateDeliveryFee();
    setDeliveryFee(fee);
    onDeliveryFeeCalculated?.(fee, distance || undefined);
  }, [selectedDepartment, selectedMunicipality, userLocation, distance, onDeliveryFeeCalculated]);

  // Actualizar centro del mapa
  useEffect(() => {
    if (userLocation) {
      // ✅ PRIORIDAD: Si hay ubicación GPS, centrar en el usuario
      console.log('🗺️ DeliveryMap: Centrando mapa en ubicación GPS del usuario:', userLocation);
      console.log('🎯 DeliveryMap: Coordenadas exactas - Lat:', userLocation.lat, 'Lng:', userLocation.lng);
      setMapCenter([userLocation.lat, userLocation.lng]);
    } else if (selectedDepartment && DELIVERY_ZONES[selectedDepartment as keyof typeof DELIVERY_ZONES]) {
      // Fallback: centrar en el departamento seleccionado
      const zone = DELIVERY_ZONES[selectedDepartment as keyof typeof DELIVERY_ZONES];
      console.log('🗺️ DeliveryMap: Centrando mapa en departamento:', selectedDepartment);
      setMapCenter(zone.center as [number, number]);
    }
  }, [selectedDepartment, userLocation]);

  useEffect(() => {
    // ✅ ARREGLAR: Configurar íconos de Leaflet solo en el cliente
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando mapa...</span>
        </CardContent>
      </Card>
    );
  }

  const selectedZone = selectedDepartment ? DELIVERY_ZONES[selectedDepartment as keyof typeof DELIVERY_ZONES] : null;
  const selectedMunicipalityData = selectedZone && selectedMunicipality ? 
    selectedZone.municipalities[selectedMunicipality as keyof typeof selectedZone.municipalities] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Calculadora de Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información de delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="font-medium">Costo de Delivery:</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              Q{deliveryFee.toFixed(2)}
            </div>
            {distance && (
              <div className="text-sm text-muted-foreground">
                Distancia: {distance.toFixed(1)} km
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <div><strong>Departamento:</strong> {selectedDepartment || 'No seleccionado'}</div>
              <div><strong>Municipio:</strong> {selectedMunicipality || 'No seleccionado'}</div>
            </div>
            {!userLocation && (
              <div className="text-xs text-amber-600">
                💡 Activa tu geolocalización para cálculo exacto
              </div>
            )}
          </div>
        </div>

        {/* Mapa */}
        <div className="h-64 w-full rounded-lg overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={userLocation ? 15 : (selectedMunicipality ? 13 : 10)}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marcador del municipio seleccionado */}
            {selectedMunicipalityData && (
              <Marker position={selectedMunicipalityData.coords as [number, number]}>
                <Popup>
                  <div className="text-center">
                    <strong>{selectedMunicipality}</strong><br />
                    Delivery: Q{selectedMunicipalityData.fee}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Marcador de ubicación del usuario */}
            {userLocation && (
              <>
                {console.log('📍 DeliveryMap: Renderizando marcador GPS en:', userLocation)}
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>🎯 Tu ubicación GPS</strong><br />
                      Lat: {userLocation.lat.toFixed(6)}<br />
                      Lng: {userLocation.lng.toFixed(6)}<br />
                      {distance && `${distance.toFixed(1)} km al destino`}
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
            
            {/* Mostrar todos los municipios del departamento */}
            {selectedZone && Object.entries(selectedZone.municipalities).map(([name, data]) => (
              <Marker key={name} position={data.coords as [number, number]}>
                <Popup>
                  <div className="text-center">
                    <strong>{name}</strong><br />
                    Delivery: Q{data.fee}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Tarifas por zona */}
        <div className="text-xs text-muted-foreground">
          <strong>Tarifas base:</strong> Guatemala Q15-35, Sacatepéquez Q35-45. 
          Con geolocalización se ajusta por distancia exacta (+Q2/km después de 5km).
        </div>
      </CardContent>
    </Card>
  );
}




