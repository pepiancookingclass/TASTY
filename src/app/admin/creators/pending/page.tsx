'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Search, 
  Check, 
  X, 
  Eye, 
  Mail,
  Phone,
  Instagram,
  Loader2,
  ChefHat,
  Calendar
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
import Image from 'next/image';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PendingCreator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_picture_url?: string;
  instagram?: string;
  skills: string[];
  address_city?: string;
  address_state?: string;
  workspace_photos?: string[];
  creator_status: string;
  created_at: string;
}

export default function PendingCreatorsPage() {
  const { canManageAllCreators, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const t = dict.admin.creatorsPending;
  
  const [creators, setCreators] = useState<PendingCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<PendingCreator | null>(null);

  // Verificar permisos
  useEffect(() => {
    if (!permissionsLoading && !canManageAllCreators) {
      router.push('/');
    }
  }, [canManageAllCreators, permissionsLoading, router]);

  // Cargar creadores pendientes
  const fetchPendingCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('creator_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching pending creators:', error);
      toast({
        variant: "destructive",
        title: t?.loadErrorTitle ?? "Error",
        description: t?.loadErrorDesc ?? "No se pudieron cargar las solicitudes pendientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageAllCreators) {
      fetchPendingCreators();
    }
  }, [canManageAllCreators]);

  // Aprobar creador
  const handleApprove = async (creatorId: string) => {
    setProcessingId(creatorId);
    try {
      const { error } = await supabase.rpc('approve_creator', {
        user_uuid: creatorId
      });

      if (error) throw error;

      toast({
        title: t?.approveTitle ?? "✅ Creador Aprobado",
        description: t?.approveDesc ?? "El creador ha sido aprobado y se han enviado los emails correspondientes.",
      });

      // Recargar la lista
      fetchPendingCreators();
    } catch (error) {
      console.error('Error approving creator:', error);
      toast({
        variant: "destructive",
        title: t?.approveErrorTitle ?? "Error",
        description: t?.approveErrorDesc ?? "No se pudo aprobar el creador. Intenta de nuevo.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Rechazar creador
  const handleReject = async (creatorId: string, reason: string) => {
    setProcessingId(creatorId);
    try {
      const { error } = await supabase.rpc('reject_creator', {
        user_uuid: creatorId,
        rejection_reason: reason || 'No se especificó una razón'
      });

      if (error) throw error;

      toast({
        title: t?.rejectTitle ?? "❌ Creador Rechazado",
        description: t?.rejectDesc ?? "La solicitud ha sido rechazada y se han enviado los emails correspondientes.",
      });

      // Recargar la lista
      fetchPendingCreators();
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting creator:', error);
      toast({
        variant: "destructive",
        title: t?.rejectErrorTitle ?? "Error",
        description: t?.rejectErrorDesc ?? "No se pudo rechazar el creador. Intenta de nuevo.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Filtrar creadores
  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.instagram?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canManageAllCreators) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline text-4xl font-bold mb-2">{t?.title ?? "Solicitudes de Creadores"}</h1>
          <p className="text-muted-foreground">
            {t?.subtitle ?? "Gestiona las solicitudes pendientes de nuevos creadores"}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {filteredCreators.length} {t?.pendingBadge ?? "Pendientes"}
        </Badge>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t?.searchPlaceholder ?? "Buscar por nombre, email o Instagram..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de solicitudes */}
      {filteredCreators.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-headline text-xl mb-2">No hay solicitudes pendientes</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron solicitudes que coincidan con tu búsqueda.' : 'Todas las solicitudes han sido procesadas.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCreators.map((creator) => (
            <Card key={creator.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Información básica */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      {creator.profile_picture_url ? (
                        <Image
                          src={creator.profile_picture_url}
                          alt={creator.name}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-headline text-xl font-semibold mb-1">
                          {creator.name}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {creator.email}
                          </div>
                          {creator.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {creator.phone}
                            </div>
                          )}
                          {creator.instagram && (
                            <div className="flex items-center gap-1">
                              <Instagram className="w-4 h-4" />
                              {creator.instagram}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Solicitado el {new Date(creator.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>

                    {/* Especialidades */}
                    {creator.skills && creator.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Especialidades:</h4>
                        <div className="flex flex-wrap gap-2">
                          {creator.skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill === 'pastry' ? 'Repostería' : 
                               skill === 'savory' ? 'Platos Salados' : 
                               skill === 'handmade' ? 'Artesanal' : skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ubicación */}
                    {(creator.address_city || creator.address_state) && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-1">Ubicación:</h4>
                        <p className="text-sm text-muted-foreground">
                          {creator.address_city}, {creator.address_state}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fotos del workspace */}
                  {creator.workspace_photos && creator.workspace_photos.length > 0 && (
                    <div className="lg:w-80">
                      <h4 className="font-medium mb-2">Fotos del Workspace:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {creator.workspace_photos.slice(0, 4).map((photo, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image
                              src={photo}
                              alt={`Workspace ${index + 1}`}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                      {creator.workspace_photos.length > 4 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          +{creator.workspace_photos.length - 4} fotos más
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
                  {/* Ver detalles */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedCreator(creator)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalles de la Solicitud</DialogTitle>
                        <DialogDescription>
                          Información completa del solicitante
                        </DialogDescription>
                      </DialogHeader>
                      {selectedCreator && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Nombre Completo</Label>
                              <p className="font-medium">{selectedCreator.name}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="font-medium">{selectedCreator.email}</p>
                            </div>
                            <div>
                              <Label>Teléfono</Label>
                              <p className="font-medium">{selectedCreator.phone || 'No proporcionado'}</p>
                            </div>
                            <div>
                              <Label>Instagram</Label>
                              <p className="font-medium">{selectedCreator.instagram || 'No proporcionado'}</p>
                            </div>
                          </div>
                          
                          {selectedCreator.workspace_photos && selectedCreator.workspace_photos.length > 0 && (
                            <div>
                              <Label>Fotos del Workspace</Label>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                {selectedCreator.workspace_photos.map((photo, index) => (
                                  <div key={index} className="relative aspect-square">
                                    <Image
                                      src={photo}
                                      alt={`Workspace ${index + 1}`}
                                      fill
                                      className="object-cover rounded-lg"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Aprobar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={processingId === creator.id}
                      >
                        {processingId === creator.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                      {t?.approveCta ?? "Aprobar"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>{t?.approveTitleDialog ?? "¿Aprobar este creador?"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t?.approveDescDialog
                          ? t.approveDescDialog
                          : `Se activará el perfil de creador para ${creator.name} y se enviarán emails de bienvenida.`}
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>{t?.cancel ?? "Cancelar"}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleApprove(creator.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                        {t?.approveConfirm ?? "Sí, Aprobar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Rechazar */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        disabled={processingId === creator.id}
                      >
                        {processingId === creator.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                      {t?.rejectCta ?? "Rechazar"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                      <DialogTitle>{t?.rejectDialogTitle ?? "Rechazar Solicitud"}</DialogTitle>
                      <DialogDescription>
                        {t?.rejectDialogDesc ?? "Proporciona una razón para el rechazo. Esto se enviará al solicitante."}
                      </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                        <Label htmlFor="reason">{t?.rejectReasonLabel ?? "Razón del rechazo"}</Label>
                          <Textarea
                            id="reason"
                          placeholder={t?.rejectReasonPlaceholder ?? "Ej: Las fotos de los productos no tienen la calidad suficiente..."}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                      <Button variant="outline" onClick={() => setRejectionReason('')}>
                        {t?.cancel ?? "Cancelar"}
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleReject(creator.id, rejectionReason)}
                          disabled={!rejectionReason.trim()}
                        >
                        {t?.rejectSubmit ?? "Rechazar Solicitud"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



