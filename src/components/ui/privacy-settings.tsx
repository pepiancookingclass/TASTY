'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, Trash2, Eye, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
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
  const dict = useDictionary();
  
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
        title: dict.privacySettings.errorLoadTitle,
        description: dict.privacySettings.errorLoadDesc
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
        title: dict.privacySettings.deletedTitle,
        description: dict.privacySettings.deletedDesc
      });

      // Recargar estado
      await loadPrivacyStatus();
    } catch (error) {
      console.error('Error deleting location data:', error);
      toast({
        variant: "destructive",
        title: dict.privacySettings.errorLoadTitle,
        description: dict.privacySettings.errorDeleteDesc
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
          {dict.privacySettings.loading}
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
          {dict.privacySettings.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className="space-y-4">
          <h4 className="font-medium">{dict.privacySettings.currentStatus}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className={`h-4 w-4 ${privacyStatus.has_location_data ? 'text-orange-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium">{dict.privacySettings.locationData}</p>
                <p className="text-xs text-muted-foreground">
                  {privacyStatus.has_location_data ? dict.privacySettings.locationSaved : dict.privacySettings.locationNotSaved}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Eye className={`h-4 w-4 ${privacyStatus.has_address_data ? 'text-blue-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium">{dict.privacySettings.addressData}</p>
                <p className="text-xs text-muted-foreground">
                  {privacyStatus.has_address_data ? dict.privacySettings.locationSaved : dict.privacySettings.locationNotSaved}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas de pedidos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">{dict.privacySettings.ordersHistory}</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">{dict.privacySettings.pendingOrders}</span>
                <span className="ml-2">{privacyStatus.pending_orders_with_location}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">{dict.privacySettings.deliveredOrders}</span>
                <span className="ml-2">{privacyStatus.delivered_orders_with_location}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Acciones */}
        <div className="space-y-4">
          <h4 className="font-medium">{dict.privacySettings.manageData}</h4>
          
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-1">{dict.privacySettings.autoProtectionTitle}</h5>
              <p className="text-sm text-green-700">
                {dict.privacySettings.autoProtectionDesc}
              </p>
            </div>

            {(privacyStatus.has_location_data || privacyStatus.has_address_data) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-800 mb-2">{dict.privacySettings.deleteAllTitle}</h5>
                <p className="text-sm text-red-700 mb-3">
                  {dict.privacySettings.deleteAllDesc}
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {dict.privacySettings.deleting}
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {dict.privacySettings.deleteButton}
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{dict.privacySettings.confirmTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {dict.privacySettings.confirmDesc}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{dict.privacySettings.confirmCancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteLocationData} className="bg-red-600 hover:bg-red-700">
                        {dict.privacySettings.confirmYes}
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
          <p><strong>{dict.privacySettings.infoTitle}</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {dict.privacySettings.infoBullets.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
