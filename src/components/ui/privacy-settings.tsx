'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, Trash2, Eye, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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

interface PrivacyStatus {
  has_location_data: boolean;
  has_address_data: boolean;
  pending_orders_with_location: number;
  delivered_orders_with_location: number;
}

export function PrivacySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar estado de privacidad
  const loadPrivacyStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_privacy_status', { user_id: user.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPrivacyStatus(data[0]);
      }
    } catch (error) {
      console.error('Error loading privacy status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el estado de privacidad"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar datos de ubicación
  const deleteLocationData = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .rpc('delete_user_personal_data', { user_id: user.id });

      if (error) throw error;

      toast({
        title: "✅ Datos eliminados",
        description: "Toda tu información de ubicación ha sido eliminada"
      });

      // Recargar estado
      await loadPrivacyStatus();
    } catch (error) {
      console.error('Error deleting location data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron eliminar los datos"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadPrivacyStatus();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando configuración de privacidad...
        </CardContent>
      </Card>
    );
  }

  if (!privacyStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configuración de Privacidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className="space-y-4">
          <h4 className="font-medium">Estado Actual de tus Datos</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className={`h-4 w-4 ${privacyStatus.has_location_data ? 'text-orange-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium">Datos de Ubicación</p>
                <p className="text-xs text-muted-foreground">
                  {privacyStatus.has_location_data ? 'Guardados en tu perfil' : 'No guardados'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Eye className={`h-4 w-4 ${privacyStatus.has_address_data ? 'text-blue-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium">Datos de Dirección</p>
                <p className="text-xs text-muted-foreground">
                  {privacyStatus.has_address_data ? 'Guardados en tu perfil' : 'No guardados'}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas de pedidos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">Historial de Pedidos</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Pedidos pendientes:</span>
                <span className="ml-2">{privacyStatus.pending_orders_with_location}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Pedidos entregados:</span>
                <span className="ml-2">{privacyStatus.delivered_orders_with_location}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Acciones */}
        <div className="space-y-4">
          <h4 className="font-medium">Gestionar tus Datos</h4>
          
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-1">✅ Protección Automática</h5>
              <p className="text-sm text-green-700">
                Cuando haces un pedido y eliges "eliminar después de entrega", 
                tus datos se borran automáticamente una vez completado.
              </p>
            </div>

            {(privacyStatus.has_location_data || privacyStatus.has_address_data) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-800 mb-2">🗑️ Eliminar Todos los Datos</h5>
                <p className="text-sm text-red-700 mb-3">
                  Elimina permanentemente toda tu información de ubicación y direcciones guardadas.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Mis Datos de Ubicación
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar datos de ubicación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente:
                        <br />• Tu dirección guardada en el perfil
                        <br />• Coordenadas de geolocalización
                        <br />• Datos de ubicación de pedidos pendientes
                        <br /><br />
                        Los pedidos ya entregados no se verán afectados.
                        <br /><br />
                        <strong>Esta acción no se puede deshacer.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteLocationData} className="bg-red-600 hover:bg-red-700">
                        Sí, Eliminar Datos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Información */}
        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Política de Privacidad:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Solo pedimos tu ubicación cuando vas a hacer un pedido</li>
            <li>Tú decides si guardar o eliminar tus datos después de cada entrega</li>
            <li>Puedes eliminar todos tus datos en cualquier momento</li>
            <li>No compartimos tu ubicación con terceros</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
