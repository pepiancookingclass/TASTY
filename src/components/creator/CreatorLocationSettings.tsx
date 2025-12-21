'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Settings, 
  Clock,
  DollarSign,
  Radius,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreatorLocationData {
  creator_latitude: number | null;
  creator_longitude: number | null;
  creator_address: string;
  creator_delivery_radius: number;
  creator_base_delivery_fee: number;
  creator_per_km_fee: number;
}

interface TemporaryLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  valid_until: string;
  reason: string;
  is_active: boolean;
}

export function CreatorLocationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { location, error: locationError, loading: isGettingLocation, getLocation } = useGeolocation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTempLocationDialog, setShowTempLocationDialog] = useState(false);
  
  const [locationData, setLocationData] = useState<CreatorLocationData>({
    creator_latitude: null,
    creator_longitude: null,
    creator_address: '',
    creator_delivery_radius: 20,
    creator_base_delivery_fee: 15.00,
    creator_per_km_fee: 2.00
  });
  
  const [temporaryLocations, setTemporaryLocations] = useState<TemporaryLocation[]>([]);
  
  const [tempLocationForm, setTempLocationForm] = useState({
    address: '',
    reason: '',
    valid_until: '',
    use_current_location: false
  });

  // Cargar datos del creador
  useEffect(() => {
    loadCreatorLocationData();
    loadTemporaryLocations();
  }, [user]);

  const loadCreatorLocationData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          creator_latitude,
          creator_longitude,
          creator_address,
          creator_delivery_radius,
          creator_base_delivery_fee,
          creator_per_km_fee
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setLocationData({
          creator_latitude: data.creator_latitude,
          creator_longitude: data.creator_longitude,
          creator_address: data.creator_address || '',
          creator_delivery_radius: data.creator_delivery_radius || 20,
          creator_base_delivery_fee: data.creator_base_delivery_fee || 15.00,
          creator_per_km_fee: data.creator_per_km_fee || 2.00
        });
      }
    } catch (error: any) {
      console.error('Error loading creator location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos de ubicación"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemporaryLocations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('creator_temporary_locations')
        .select('*')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemporaryLocations(data || []);
    } catch (error: any) {
      console.error('Error loading temporary locations:', error);
    }
  };

  const handleSetCurrentLocation = () => {
    getLocation();
  };

  // Actualizar ubicación cuando se obtiene geolocalización
  useEffect(() => {
    if (location) {
      setLocationData(prev => ({
        ...prev,
        creator_latitude: location.lat,
        creator_longitude: location.lng
      }));
    }
  }, [location]);

  const handleSaveLocationSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          creator_latitude: locationData.creator_latitude,
          creator_longitude: locationData.creator_longitude,
          creator_address: locationData.creator_address,
          creator_delivery_radius: locationData.creator_delivery_radius,
          creator_base_delivery_fee: locationData.creator_base_delivery_fee,
          creator_per_km_fee: locationData.creator_per_km_fee
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "✅ Configuración guardada",
        description: "Tu configuración de delivery ha sido actualizada"
      });
    } catch (error: any) {
      console.error('Error saving location settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTemporaryLocation = async () => {
    if (!user) return;
    
    let latitude = locationData.creator_latitude;
    let longitude = locationData.creator_longitude;
    
    // Si quiere usar ubicación actual y la tenemos
    if (tempLocationForm.use_current_location && location) {
      latitude = location.lat;
      longitude = location.lng;
    }
    
    if (!latitude || !longitude) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Necesitas configurar una ubicación primero"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('creator_temporary_locations')
        .insert({
          creator_id: user.id,
          latitude,
          longitude,
          address: tempLocationForm.address,
          reason: tempLocationForm.reason,
          valid_until: tempLocationForm.valid_until
        });

      if (error) throw error;

      toast({
        title: "✅ Ubicación temporal agregada",
        description: "La ubicación temporal ha sido configurada"
      });
      
      setShowTempLocationDialog(false);
      setTempLocationForm({
        address: '',
        reason: '',
        valid_until: '',
        use_current_location: false
      });
      
      loadTemporaryLocations();
    } catch (error: any) {
      console.error('Error adding temporary location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la ubicación temporal"
      });
    }
  };

  const handleRemoveTemporaryLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('creator_temporary_locations')
        .update({ is_active: false })
        .eq('id', locationId);

      if (error) throw error;

      toast({
        title: "✅ Ubicación temporal eliminada",
        description: "La ubicación temporal ha sido desactivada"
      });
      
      loadTemporaryLocations();
    } catch (error: any) {
      console.error('Error removing temporary location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la ubicación temporal"
      });
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(price);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Cargando configuración...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ubicación Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación Base de Entrega
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta es tu ubicación principal desde donde entregas (casa, taller, etc.)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitud</Label>
              <Input
                type="number"
                step="0.000001"
                value={locationData.creator_latitude || ''}
                onChange={(e) => setLocationData(prev => ({
                  ...prev,
                  creator_latitude: parseFloat(e.target.value) || null
                }))}
                placeholder="14.634915"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitud</Label>
              <Input
                type="number"
                step="0.000001"
                value={locationData.creator_longitude || ''}
                onChange={(e) => setLocationData(prev => ({
                  ...prev,
                  creator_longitude: parseFloat(e.target.value) || null
                }))}
                placeholder="-90.506882"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Textarea
              value={locationData.creator_address}
              onChange={(e) => setLocationData(prev => ({
                ...prev,
                creator_address: e.target.value
              }))}
              placeholder="Ej: 5ta Avenida 12-34, Zona 1, Ciudad de Guatemala"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSetCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Obteniendo...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Usar Mi Ubicación Actual
                </>
              )}
            </Button>
          </div>

          {locationError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {locationError}
            </div>
          )}

          {location && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Ubicación obtenida: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de Delivery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Radius className="h-4 w-4" />
                Radio Máximo (km)
              </Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={locationData.creator_delivery_radius}
                onChange={(e) => setLocationData(prev => ({
                  ...prev,
                  creator_delivery_radius: parseInt(e.target.value) || 20
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Tarifa Base
              </Label>
              <Input
                type="number"
                step="0.50"
                min="0"
                value={locationData.creator_base_delivery_fee}
                onChange={(e) => setLocationData(prev => ({
                  ...prev,
                  creator_base_delivery_fee: parseFloat(e.target.value) || 15.00
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Costo por km adicional
              </Label>
              <Input
                type="number"
                step="0.25"
                min="0"
                value={locationData.creator_per_km_fee}
                onChange={(e) => setLocationData(prev => ({
                  ...prev,
                  creator_per_km_fee: parseFloat(e.target.value) || 2.00
                }))}
              />
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Ejemplo de Cálculo:</h4>
            <p className="text-sm text-muted-foreground">
              • Primeros 3 km: {formatPrice(locationData.creator_base_delivery_fee)}
              <br />
              • Km adicionales: +{formatPrice(locationData.creator_per_km_fee)} por km
              <br />
              • Radio máximo: {locationData.creator_delivery_radius} km
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ubicaciones Temporales */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ubicaciones Temporales
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Para cuando entregas desde otro lugar (eventos, mercados, etc.)
              </p>
            </div>
            <Dialog open={showTempLocationDialog} onOpenChange={setShowTempLocationDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Ubicación Temporal</DialogTitle>
                  <DialogDescription>
                    Configura una ubicación temporal desde donde entregarás por un tiempo limitado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Textarea
                      value={tempLocationForm.address}
                      onChange={(e) => setTempLocationForm(prev => ({
                        ...prev,
                        address: e.target.value
                      }))}
                      placeholder="Ej: Mercado Central, Stand 15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo</Label>
                    <Input
                      value={tempLocationForm.reason}
                      onChange={(e) => setTempLocationForm(prev => ({
                        ...prev,
                        reason: e.target.value
                      }))}
                      placeholder="Ej: Evento especial, Mercado navideño"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Válido hasta</Label>
                    <Input
                      type="datetime-local"
                      value={tempLocationForm.valid_until}
                      onChange={(e) => setTempLocationForm(prev => ({
                        ...prev,
                        valid_until: e.target.value
                      }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTempLocationDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddTemporaryLocation}>
                    Agregar Ubicación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {temporaryLocations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tienes ubicaciones temporales configuradas
            </p>
          ) : (
            <div className="space-y-3">
              {temporaryLocations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{location.address}</p>
                    <p className="text-sm text-muted-foreground">{location.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Válido hasta: {new Date(location.valid_until).toLocaleString('es-GT')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTemporaryLocation(location.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guardar Cambios */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveLocationSettings}
          disabled={saving || !locationData.creator_latitude || !locationData.creator_longitude}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
