'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Check } from 'lucide-react';

// Importar Leaflet dinámicamente para evitar errores de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// ✅ SOLUCIÓN CORRECTA: Componente simple para manejar clicks SIN dynamic import
import { useMapEvents } from 'react-leaflet';

function MapClickHandler({ onLocationSelected }: { onLocationSelected: (location: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (e) => {
      console.log('🖱️ MapClickHandler: ¡CLICK DETECTADO VÍA useMapEvents! [' + new Date().toISOString() + ']', e);
      console.log('📍 MapClickHandler: Coordenadas del evento:', e.latlng);
      
      if (e.latlng) {
        const { lat, lng } = e.latlng;
        console.log('✅ MapClickHandler: Procesando click en coordenadas:', { lat, lng });
        onLocationSelected({ lat, lng });
      } else {
        console.log('❌ MapClickHandler: Evento sin coordenadas latlng');
      }
    }
  });
  
  return null; // Este componente no renderiza nada
}

interface LocationSelectorProps {
  onLocationSelected: (location: { lat: number; lng: number }) => void;
  onCancel: () => void;
}

export function LocationSelector({ onLocationSelected, onCancel }: LocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter] = useState<[number, number]>([14.6349, -90.5069]); // Guatemala City
  
  console.log('🗺️ LocationSelector: Componente montado');

  // Configurar íconos de Leaflet
  useEffect(() => {
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
  }, []);

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    console.log('📍 LocationSelector: Ubicación recibida del mapa:', location);
    setSelectedLocation(location);
    console.log('✅ LocationSelector: Estado actualizado - Botón "Confirmar" debería habilitarse ahora');
  };

  const handleConfirm = () => {
    console.log('✅ LocationSelector: Confirmando ubicación:', selectedLocation);
    if (selectedLocation) {
      onLocationSelected(selectedLocation);
    } else {
      console.log('❌ LocationSelector: No hay ubicación seleccionada para confirmar');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Seleccionar Ubicación de Entrega
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Haz clic en el mapa para seleccionar tu ubicación exacta de entrega
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 w-full rounded-lg overflow-hidden border" id="location-map-container">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* ✅ SOLUCIÓN: Usar MapClickHandler como componente hijo */}
            <MapClickHandler onLocationSelected={handleLocationSelect} />
            
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <strong>📍 Ubicación seleccionada</strong><br />
                    Lat: {selectedLocation.lat.toFixed(6)}<br />
                    Lng: {selectedLocation.lng.toFixed(6)}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {selectedLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="font-medium">Ubicación seleccionada</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              📍 Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="flex-1"
          >
            <Check className="mr-2 h-4 w-4" />
            Confirmar Ubicación
          </Button>
          <Button 
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



