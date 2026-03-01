'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useDictionary } from '@/hooks/useDictionary';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Check, X, MapPin, ChefHat } from 'lucide-react';
import { PrivacySettings } from '@/components/ui/privacy-settings';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import { LocationSelector } from '@/components/ui/location-selector';
import { useGeolocation } from '@/hooks/useGeolocation';

type Skill = 'pastry' | 'savory' | 'handmade';

// Datos de Guatemala
const GUATEMALA_DEPARTMENTS = {
  'Guatemala': [
    'Guatemala', 'Mixco', 'Villa Nueva', 'Petapa', 'San José Pinula', 'San José del Golfo',
    'Palencia', 'Chinautla', 'San Pedro Ayampuc', 'San Pedro Sacatepéquez', 'San Juan Sacatepéquez',
    'San Raymundo', 'Chuarrancho', 'Fraijanes', 'Amatitlán', 'Villa Canales', 'Santa Catarina Pinula'
  ],
  'Sacatepéquez': [
    'Antigua Guatemala', 'Jocotenango', 'Pastores', 'Sumpango', 'Santo Domingo Xenacoj',
    'Santiago Sacatepéquez', 'San Bartolomé Milpas Altas', 'San Lucas Sacatepéquez',
    'Santa Lucía Milpas Altas', 'Magdalena Milpas Altas', 'Santa María de Jesús',
    'Ciudad Vieja', 'San Miguel Dueñas', 'Alotenango', 'San Antonio Aguas Calientes', 'Santa Catarina Barahona'
  ]
};

export default function UserProfilePage() {
  const { user: authUser } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const router = useRouter();
  const dict = useDictionary();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados simples - sin dependencias complejas
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    profilePictureUrl: '',
    instagram: '',
    gender: 'female' as 'female' | 'male' | 'other',
    availabilityStatus: 'available' as 'available' | 'vacation' | 'busy',
    skills: [] as Skill[],
    workspacePhotos: [] as string[],
    street: '',
    city: '',
    state: '', // Departamento
    country: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  
  // Preview state para foto
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Estados para dropdowns de ubicación
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);

  // ✅ COPIADO DEL CHECKOUT: Estados para ubicación del creador
  const { location: creatorGPSLocation, error: locationError, loading: isGettingLocationGPS, getLocation } = useGeolocation();
  const [creatorManualLocation, setCreatorManualLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [creatorDeliveryConfig, setCreatorDeliveryConfig] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    address: '',
    deliveryRadius: 50,
    // Tarifas para MOTO
    baseFeeMoto: 25.00,
    perKmFeeMoto: 3.00,
    // Tarifas para CARRO
    baseFeeAuto: 40.00,
    perKmFeeAuto: 5.00
  });
  
  const finalCreatorLocation = creatorGPSLocation || creatorManualLocation;

  const isCreator = roles.includes('creator');

  // Cargar datos cuando authUser y roles estén listos
  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser) {
        router.push('/login');
        return;
      }

      // Esperar a que roles termine de cargar
      if (rolesLoading) {
        return;
      }

      try {
        setLoading(true);
        
        // Obtener datos del usuario desde Supabase
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        console.warn('🔄 CARGANDO DATOS DE USUARIO:', JSON.stringify({ userData, error }, null, 2));

        if (userData && !error) {
          const newFormData = {
            displayName: userData.name || '',
            email: userData.email || authUser.email || '',
            phone: userData.phone || '',
            profilePictureUrl: userData.profile_picture_url || '',
            instagram: userData.instagram || '',
            gender: (userData.gender as 'female' | 'male' | 'other') || 'female',
            availabilityStatus: (userData.availability_status as 'available' | 'vacation' | 'busy') || 'available',
            skills: userData.skills || [],
            workspacePhotos: userData.workspace_photos || [],
            street: userData.address_street || '',
            city: userData.address_city || '',
            state: userData.address_state || '',
            country: userData.address_country || ''
          };
          
          console.warn('📝 DATOS CARGADOS:', JSON.stringify(newFormData, null, 2));
          setFormData(newFormData);
          
          // ✅ CARGAR CONFIGURACIÓN DE DELIVERY (siempre, los datos están en userData)
          // La sección solo se muestra si isCreator, pero cargamos los datos de todos modos
          setCreatorDeliveryConfig({
            latitude: userData.creator_latitude ?? null,
            longitude: userData.creator_longitude ?? null,
            address: userData.creator_address || '',
            deliveryRadius: userData.creator_delivery_radius || 50,
            // Tarifas MOTO
            baseFeeMoto: userData.creator_base_delivery_fee_moto ?? userData.creator_base_delivery_fee ?? 25.00,
            perKmFeeMoto: userData.creator_per_km_fee_moto ?? userData.creator_per_km_fee ?? 3.00,
            // Tarifas CARRO
            baseFeeAuto: userData.creator_base_delivery_fee_auto ?? 40.00,
            perKmFeeAuto: userData.creator_per_km_fee_auto ?? 5.00
          });
          console.log('🚚 Profile: Configuración delivery cargada:', {
            lat: userData.creator_latitude,
            lng: userData.creator_longitude,
            address: userData.creator_address,
            radius: userData.creator_delivery_radius,
            baseFeeMoto: userData.creator_base_delivery_fee_moto,
            perKmFeeMoto: userData.creator_per_km_fee_moto,
            baseFeeAuto: userData.creator_base_delivery_fee_auto,
            perKmFeeAuto: userData.creator_per_km_fee_auto
          });
          
          // Configurar departamento y municipios si ya hay datos
          if (userData.address_state) {
            setSelectedDepartment(userData.address_state);
            const municipalities = GUATEMALA_DEPARTMENTS[userData.address_state as keyof typeof GUATEMALA_DEPARTMENTS] || [];
            setAvailableMunicipalities(municipalities);
          }
        } else {
          // Si no existe el usuario en la tabla, usar datos básicos
          console.warn('⚠️ Usuario no encontrado en DB, usando datos básicos');
          setFormData(prev => ({
            ...prev,
            email: authUser.email || '',
            displayName: authUser.user_metadata?.name || authUser.email?.split('@')[0] || ''
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos del perfil"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [authUser, rolesLoading]); // Ejecutar cuando authUser cambie o roles termine de cargar

  // Función simple para actualizar campos
  const updateField = (field: string, value: any) => {
    console.warn(`🔄 ACTUALIZANDO CAMPO: ${field} =`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para actualizar disponibilidad de forma instantánea
  const updateAvailabilityStatus = async (newStatus: 'available' | 'vacation' | 'busy') => {
    if (!authUser || isSavingAvailability) return;
    
    setIsSavingAvailability(true);
    
    try {
      console.log('🔄 Actualizando availability_status a:', newStatus);
      
      const { data, error } = await supabase
        .from('users')
        .update({ availability_status: newStatus })
        .eq('id', authUser.id)
        .select();
      
      console.log('📝 Resultado update:', { data, error });
      
      if (error) throw error;
      
      // Actualizar estado local
      setFormData(prev => ({ ...prev, availabilityStatus: newStatus }));
      
      const statusLabels = {
        available: '✅ Disponible',
        vacation: '🏖️ Vacaciones',
        busy: '📦 Muchos pedidos'
      };
      
      toast({
        title: 'Estado actualizado',
        description: `Tu estado ahora es: ${statusLabels[newStatus]}`,
      });
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado"
      });
    } finally {
      setIsSavingAvailability(false);
    }
  };

  // Manejar cambio de departamento
  const handleDepartmentChange = (department: string) => {
    console.warn('🏛️ DEPARTAMENTO SELECCIONADO:', department);
    setSelectedDepartment(department);
    updateField('state', department);
    
    // Actualizar municipios disponibles
    const municipalities = GUATEMALA_DEPARTMENTS[department as keyof typeof GUATEMALA_DEPARTMENTS] || [];
    setAvailableMunicipalities(municipalities);
    
    // Limpiar ciudad si no está en la nueva lista
    if (formData.city && !municipalities.includes(formData.city)) {
      updateField('city', '');
    }
  };


  // Manejar subida de foto de perfil
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.warn('📁 ARCHIVO SELECCIONADO:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      console.warn('❌ TIPO DE ARCHIVO INVÁLIDO:', file.type);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona una imagen válida"
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    console.warn('👁️ PREVIEW URL CREADA:', url);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !authUser) return;

    setIsUploadingPhoto(true);
    
    try {
      const ext = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `profiles/${fileName}`;

      // Subir archivo
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      const newPhotoUrl = data.publicUrl;

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: newPhotoUrl })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      // Actualizar estado local
      updateField('profilePictureUrl', newPhotoUrl);
      
      toast({ title: '✅ Foto actualizada correctamente' });
      handleCancelPreview();
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir la foto"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ COPIADO DEL CHECKOUT: Funciones para ubicación del creador
  const handleCreatorLocationSelected = (location: { lat: number; lng: number }) => {
    console.log('📍 Profile: Ubicación del creador seleccionada:', location);
    setCreatorDeliveryConfig(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      address: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`
    }));
    setCreatorManualLocation(location);
    setShowLocationSelector(false);
    
    toast({
      title: '✅ Ubicación configurada',
      description: 'Tu ubicación de entrega ha sido guardada correctamente',
    });
  };

  const handleGetCreatorLocation = () => {
    console.log('📍 Profile: Obteniendo ubicación GPS del creador...');
    getLocation();
  };

  // Efecto para actualizar ubicación cuando se obtiene GPS
  useEffect(() => {
    if (creatorGPSLocation && isCreator) {
      console.log('📍 Profile: GPS obtenido para creador:', creatorGPSLocation);
      setCreatorDeliveryConfig(prev => ({
        ...prev,
        latitude: creatorGPSLocation.lat,
        longitude: creatorGPSLocation.lng,
        address: `Ubicación GPS: ${creatorGPSLocation.lat.toFixed(6)}, ${creatorGPSLocation.lng.toFixed(6)}`
      }));
      
      toast({
        title: '✅ Ubicación GPS obtenida',
        description: 'Tu ubicación actual ha sido configurada para entregas',
      });
    }
  }, [creatorGPSLocation, isCreator]);

  // Guardar cambios
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    setIsSaving(true);
    
    try {
      const dataToSave = {
        id: authUser.id,
        name: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        instagram: formData.instagram,
        profile_picture_url: formData.profilePictureUrl || null,
        address_street: formData.street,
        address_city: formData.city,
        address_state: formData.state,
        address_country: formData.country,
        ...(isCreator && { 
          skills: formData.skills, 
          workspace_photos: formData.workspacePhotos,
          gender: formData.gender,
          availability_status: formData.availabilityStatus,
          // ✅ GUARDAR CONFIGURACIÓN DE DELIVERY
          creator_latitude: creatorDeliveryConfig.latitude,
          creator_longitude: creatorDeliveryConfig.longitude,
          creator_address: creatorDeliveryConfig.address,
          creator_delivery_radius: creatorDeliveryConfig.deliveryRadius,
          // Tarifas separadas para MOTO y CARRO
          creator_base_delivery_fee_moto: creatorDeliveryConfig.baseFeeMoto,
          creator_per_km_fee_moto: creatorDeliveryConfig.perKmFeeMoto,
          creator_base_delivery_fee_auto: creatorDeliveryConfig.baseFeeAuto,
          creator_per_km_fee_auto: creatorDeliveryConfig.perKmFeeAuto
        })
      };

      console.log('💾 Profile: Guardando datos del creador:', dataToSave);
      
      if (isCreator) {
        console.log('🚚 Profile: CONFIGURACIÓN DELIVERY A GUARDAR:', {
          latitude: creatorDeliveryConfig.latitude,
          longitude: creatorDeliveryConfig.longitude,
          address: creatorDeliveryConfig.address,
          deliveryRadius: creatorDeliveryConfig.deliveryRadius,
          baseFeeMoto: creatorDeliveryConfig.baseFeeMoto,
          perKmFeeMoto: creatorDeliveryConfig.perKmFeeMoto,
          baseFeeAuto: creatorDeliveryConfig.baseFeeAuto,
          perKmFeeAuto: creatorDeliveryConfig.perKmFeeAuto,
          nota: 'El cálculo final aplica factor 1.4 a la distancia línea recta'
        });
      }

      const { data, error } = await supabase
        .from('users')
        .upsert(dataToSave)
        .select();

      if (error) throw error;

      console.log('✅ Profile: Datos guardados exitosamente:', data);

      toast({
        title: '✅ Perfil guardado',
        description: 'Todos los cambios se han guardado correctamente',
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar perfil",
        description: error?.message || 'Error desconocido'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBecomeCreator = async () => {
    if (!authUser) return;
    
    try {
      // Llamar a la función SQL para procesar la solicitud
      const { error } = await supabase.rpc('process_creator_application', {
        user_uuid: authUser.id
      });
      
      if (error) throw error;
      
      toast({
        title: "📋 ¡Solicitud Enviada!",
        description: "Tu solicitud para ser creador está siendo revisada. Te contactaremos en 24-48 horas.",
      });
      
      // Recargar la página para actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error("Error submitting creator application: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar tu solicitud. Intenta de nuevo.",
      });
    }
  };

  if (loading || rolesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{dict.userProfile.title}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Foto de perfil */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Foto de perfil */}
                <div className="relative">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-amber-400"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleConfirmUpload}
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleCancelPreview}
                          disabled={isUploadingPhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-muted">
                        <AvatarImage src={formData.profilePictureUrl || undefined} alt={formData.displayName || ''} />
                        <AvatarFallback className="text-2xl">{(formData.displayName || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                <div className="text-center">
                  <CardTitle className="font-headline text-2xl">{formData.displayName || 'Usuario'}</CardTitle>
                  <p className="text-muted-foreground">{formData.email}</p>
                  {roles.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Roles: {roles.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{dict.userProfile.personalInfo.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveChanges}>
                <div className="space-y-6">
                  {/* Información Personal */}
                  <div>
                    <h3 className="font-headline text-lg mb-4">{dict.userProfile.personalInfo.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{dict.userProfile.personalInfo.name}</Label>
                        <Input 
                          id="name" 
                          value={formData.displayName} 
                          onChange={e => updateField('displayName', e.target.value)}
                          disabled={isSaving}
                          placeholder={dict.userProfile.personalInfo.namePlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{dict.userProfile.personalInfo.email}</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={formData.email} 
                          onChange={e => updateField('email', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{dict.userProfile.personalInfo.phone}</Label>
                        <Input 
                          id="phone" 
                          value={formData.phone} 
                          onChange={e => updateField('phone', e.target.value)}
                          disabled={isSaving}
                          placeholder={dict.userProfile.personalInfo.phonePlaceholder}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Habilidades de Creador */}
                  {isCreator && (
                    <>
                      {/* Selector de Disponibilidad - GUARDADO INSTANTÁNEO */}
                      <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                        <h4 className="font-medium mb-3">{dict.userProfile.availability?.title ?? 'Estado de disponibilidad'}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={formData.availabilityStatus === 'available' ? "default" : "outline"}
                            className={formData.availabilityStatus === 'available' ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={() => updateAvailabilityStatus('available')}
                            disabled={isSavingAvailability}
                          >
                            {isSavingAvailability ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            ✅ {dict.userProfile.availability?.available ?? 'Disponible'}
                          </Button>
                          <Button
                            type="button"
                            variant={formData.availabilityStatus === 'vacation' ? "default" : "outline"}
                            className={formData.availabilityStatus === 'vacation' ? "bg-amber-500 hover:bg-amber-600" : ""}
                            onClick={() => updateAvailabilityStatus('vacation')}
                            disabled={isSavingAvailability}
                          >
                            {isSavingAvailability ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            🏖️ {dict.userProfile.availability?.vacation ?? 'Vacaciones'}
                          </Button>
                          <Button
                            type="button"
                            variant={formData.availabilityStatus === 'busy' ? "default" : "outline"}
                            className={formData.availabilityStatus === 'busy' ? "bg-orange-500 hover:bg-orange-600" : ""}
                            onClick={() => updateAvailabilityStatus('busy')}
                            disabled={isSavingAvailability}
                          >
                            {isSavingAvailability ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            📦 {dict.userProfile.availability?.busy ?? 'Muchos pedidos'}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                          {formData.availabilityStatus === 'available' 
                            ? (dict.userProfile.availability?.availableDesc ?? 'Los clientes pueden hacer pedidos')
                            : formData.availabilityStatus === 'vacation'
                            ? (dict.userProfile.availability?.vacationDesc ?? 'Tus productos se muestran pero no se pueden ordenar')
                            : (dict.userProfile.availability?.busyDesc ?? 'Tienes muchos pedidos, no puedes aceptar más por ahora')
                          }
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-headline text-lg mb-4">{dict.userProfile.skills.title}</h3>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="pastry" 
                              checked={formData.skills.includes('pastry')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateField('skills', [...formData.skills, 'pastry']);
                                } else {
                                  updateField('skills', formData.skills.filter(s => s !== 'pastry'));
                                }
                              }}
                            />
                            <Label htmlFor="pastry">{dict.creatorSkills.pastry}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="savory" 
                              checked={formData.skills.includes('savory')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateField('skills', [...formData.skills, 'savory']);
                                } else {
                                  updateField('skills', formData.skills.filter(s => s !== 'savory'));
                                }
                              }}
                            />
                            <Label htmlFor="savory">{dict.creatorSkills.savory}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="handmade" 
                              checked={formData.skills.includes('handmade')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateField('skills', [...formData.skills, 'handmade']);
                                } else {
                                  updateField('skills', formData.skills.filter(s => s !== 'handmade'));
                                }
                              }}
                            />
                            <Label htmlFor="handmade">{dict.creatorSkills.handmade}</Label>
                          </div>
                        </div>
                        
                        {/* Instagram solo para creadores */}
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="instagram">{dict.userProfile.personalInfo.instagramLabel}</Label>
                          <Input 
                            id="instagram" 
                            value={formData.instagram} 
                            onChange={e => updateField('instagram', e.target.value)}
                            disabled={isSaving}
                            placeholder={dict.userProfile.personalInfo.instagramPlaceholder}
                          />
                        </div>
                        
                        {/* Género para creadores - define color del borde del avatar */}
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="gender">{dict.userProfile.personalInfo.genderLabel ?? 'Género'}</Label>
                          <Select 
                            value={formData.gender} 
                            onValueChange={(value: 'female' | 'male' | 'other') => updateField('gender', value)} 
                            disabled={isSaving}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tu género" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">{dict.userProfile.personalInfo.genderFemale ?? 'Femenino'}</SelectItem>
                              <SelectItem value="male">{dict.userProfile.personalInfo.genderMale ?? 'Masculino'}</SelectItem>
                              <SelectItem value="other">{dict.userProfile.personalInfo.genderOther ?? 'Prefiero no decir'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {dict.userProfile.personalInfo.genderHint ?? 'Define el color del borde de tu foto de perfil (rosa o azul)'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Fotos del Espacio de Trabajo */}
                      <div>
                        <h3 className="font-headline text-lg mb-4">{dict.userProfile.workspace.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {dict.userProfile.workspace.hint}
                        </p>
                        <MultiImageUpload
                          values={formData.workspacePhotos}
                          onChange={(photos) => updateField('workspacePhotos', photos)}
                          maxImages={5}
                          folder="workspace"
                        />
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Dirección / Dirección del creador */}
                  <div>
                    <h3 className="font-headline text-lg mb-4">
                      {isCreator ? dict.userProfile.address.creatorTitle : dict.userProfile.address.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">{dict.userProfile.address.street}</Label>
                        <Input 
                          id="street" 
                          value={formData.street} 
                          onChange={e => updateField('street', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">{dict.userProfile.address.state}</Label>
                        <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={isSaving}>
                          <SelectTrigger>
                            <SelectValue placeholder={dict.signupPage.departmentPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Guatemala">Guatemala</SelectItem>
                            <SelectItem value="Sacatepéquez">Sacatepéquez</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">{dict.userProfile.address.city}</Label>
                        <Select value={formData.city} onValueChange={(value) => updateField('city', value)} disabled={isSaving || !selectedDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedDepartment ? dict.signupPage.cityPlaceholder : dict.signupPage.departmentPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMunicipalities.map((municipality) => (
                              <SelectItem key={municipality} value={municipality}>
                                {municipality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">{dict.userProfile.address.country}</Label>
                        <Input 
                          id="country" 
                          value={formData.country} 
                          onChange={e => updateField('country', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ✅ NUEVA SECCIÓN: Configuración de Entregas para Creadores */}
                  {isCreator && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-headline text-lg mb-4">{dict.userProfile.creatorLocation.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {dict.userProfile.creatorLocation.description}
                        </p>
                        
                        {/* Botones de ubicación - COPIADOS DEL CHECKOUT */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button 
                              onClick={handleGetCreatorLocation}
                              disabled={isGettingLocationGPS}
                              className="w-full"
                              size="lg"
                              variant="default"
                            >
                              {isGettingLocationGPS ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {dict.userProfile.creatorLocation.gettingLocation}
                                </>
                              ) : (
                                <>
                                  <MapPin className="mr-2 h-4 w-4" />
                                  {dict.userProfile.creatorLocation.useCurrent}
                                </>
                              )}
                            </Button>
                            
                            <Button 
                              onClick={() => {
                                console.log('🗺️ Profile: Abriendo LocationSelector para creador...');
                                setShowLocationSelector(true);
                              }}
                              className="w-full"
                              size="lg"
                              variant="outline"
                            >
                              <MapPin className="mr-2 h-4 w-4" />
                              {dict.userProfile.creatorLocation.selectOnMap}
                            </Button>
                          </div>
                          
                          {locationError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                              ❌ {locationError}
                              <p className="mt-2 text-xs">
                                {dict.userProfile.creatorLocation.locationErrorFallback}
                              </p>
                            </div>
                          )}
                          
                          {/* Mostrar ubicación configurada */}
                          {(creatorDeliveryConfig.latitude && creatorDeliveryConfig.longitude) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <MapPin className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-green-800">
                                    {dict.userProfile.creatorLocation.configured}
                                  </h4>
                                  <p className="text-sm text-green-700">
                                    {dict.userProfile.creatorLocation.latlng(
                                      creatorDeliveryConfig.latitude.toFixed(6),
                                      creatorDeliveryConfig.longitude.toFixed(6)
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Configuración de delivery */}
                          <div className="space-y-4 mt-4">
                            {/* Radio de entrega */}
                            <div className="space-y-2">
                              <Label>{dict.userProfile.creatorLocation.radiusLabel}</Label>
                              <Input 
                                type="number" 
                                inputMode="numeric"
                                value={creatorDeliveryConfig.deliveryRadius === 0 ? '' : creatorDeliveryConfig.deliveryRadius} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCreatorDeliveryConfig(prev => ({
                                    ...prev,
                                    deliveryRadius: val === '' ? 0 : parseInt(val) || 0
                                  }));
                                }}
                                onBlur={(e) => {
                                  const finalValue = (!e.target.value || parseInt(e.target.value) <= 0) ? 50 : parseInt(e.target.value);
                                  console.log('🚚 Profile: Radio delivery modificado:', finalValue, 'km');
                                  if (!e.target.value || parseInt(e.target.value) <= 0) {
                                    setCreatorDeliveryConfig(prev => ({ ...prev, deliveryRadius: 50 }));
                                  }
                                }}
                                placeholder="50"
                                className="max-w-[200px]"
                                disabled={isSaving}
                              />
                              <p className="text-xs text-gray-500">Ejemplo: Antigua a Ciudad de Guatemala son ~45km</p>
                            </div>
                            
                            {/* Tarifas MOTO */}
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="font-medium text-blue-800 mb-2">🏍️ Tarifas Moto</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-sm">{dict.userProfile.creatorLocation.baseFeeLabel}</Label>
                                  <Input 
                                    type="number" 
                                    inputMode="numeric"
                                    step="1"
                                    value={creatorDeliveryConfig.baseFeeMoto === 0 ? '' : Math.round(creatorDeliveryConfig.baseFeeMoto)} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCreatorDeliveryConfig(prev => ({
                                        ...prev,
                                        baseFeeMoto: val === '' ? 0 : parseFloat(val) || 0
                                      }));
                                    }}
                                    onBlur={(e) => {
                                      const finalValue = (!e.target.value || parseFloat(e.target.value) <= 0) ? 25.00 : parseFloat(e.target.value);
                                      console.log('🚚 Profile: Tarifa base MOTO modificada: Q', finalValue);
                                      if (!e.target.value || parseFloat(e.target.value) <= 0) {
                                        setCreatorDeliveryConfig(prev => ({ ...prev, baseFeeMoto: 25.00 }));
                                      }
                                    }}
                                    placeholder="25.00"
                                    disabled={isSaving}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-sm">{dict.userProfile.creatorLocation.perKmFeeLabel}</Label>
                                  <Input 
                                    type="number" 
                                    inputMode="numeric"
                                    step="1"
                                    value={creatorDeliveryConfig.perKmFeeMoto === 0 ? '' : Math.round(creatorDeliveryConfig.perKmFeeMoto)} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCreatorDeliveryConfig(prev => ({
                                        ...prev,
                                        perKmFeeMoto: val === '' ? 0 : parseFloat(val) || 0
                                      }));
                                    }}
                                    onBlur={(e) => {
                                      const finalValue = (!e.target.value || parseFloat(e.target.value) <= 0) ? 3.00 : parseFloat(e.target.value);
                                      console.log('🚚 Profile: Tarifa por km MOTO modificada: Q', finalValue);
                                      if (!e.target.value || parseFloat(e.target.value) <= 0) {
                                        setCreatorDeliveryConfig(prev => ({ ...prev, perKmFeeMoto: 3.00 }));
                                      }
                                    }}
                                    placeholder="3.00"
                                    disabled={isSaving}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Tarifas CARRO */}
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="font-medium text-orange-800 mb-2">🚗 Tarifas Carro</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-sm">{dict.userProfile.creatorLocation.baseFeeLabel}</Label>
                                  <Input 
                                    type="number" 
                                    inputMode="numeric"
                                    step="1"
                                    value={creatorDeliveryConfig.baseFeeAuto === 0 ? '' : Math.round(creatorDeliveryConfig.baseFeeAuto)} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCreatorDeliveryConfig(prev => ({
                                        ...prev,
                                        baseFeeAuto: val === '' ? 0 : parseFloat(val) || 0
                                      }));
                                    }}
                                    onBlur={(e) => {
                                      const finalValue = (!e.target.value || parseFloat(e.target.value) <= 0) ? 40.00 : parseFloat(e.target.value);
                                      console.log('🚚 Profile: Tarifa base CARRO modificada: Q', finalValue);
                                      if (!e.target.value || parseFloat(e.target.value) <= 0) {
                                        setCreatorDeliveryConfig(prev => ({ ...prev, baseFeeAuto: 40.00 }));
                                      }
                                    }}
                                    placeholder="40.00"
                                    disabled={isSaving}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-sm">{dict.userProfile.creatorLocation.perKmFeeLabel}</Label>
                                  <Input 
                                    type="number" 
                                    inputMode="numeric"
                                    step="1"
                                    value={creatorDeliveryConfig.perKmFeeAuto === 0 ? '' : Math.round(creatorDeliveryConfig.perKmFeeAuto)} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCreatorDeliveryConfig(prev => ({
                                        ...prev,
                                        perKmFeeAuto: val === '' ? 0 : parseFloat(val) || 0
                                      }));
                                    }}
                                    onBlur={(e) => {
                                      const finalValue = (!e.target.value || parseFloat(e.target.value) <= 0) ? 5.00 : parseFloat(e.target.value);
                                      console.log('🚚 Profile: Tarifa por km CARRO modificada: Q', finalValue);
                                      if (!e.target.value || parseFloat(e.target.value) <= 0) {
                                        setCreatorDeliveryConfig(prev => ({ ...prev, perKmFeeAuto: 5.00 }));
                                      }
                                    }}
                                    placeholder="5.00"
                                    disabled={isSaving}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600">
                            {dict.userProfile.creatorLocation.hint}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Botón Guardar */}
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {dict.loading}
                        </>
                      ) : (
                        dict.userProfile.save
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Configuración de Privacidad */}
          <PrivacySettings />

        {/* Opción para convertirse en Creador (al final de la página) */}
        {!isCreator && (
          <div className="mt-10">
            <Separator className="mb-6" />
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline text-lg mb-2">{dict.userProfile.becomeCreator.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {dict.userProfile.becomeCreator.description}
                  </p>
                  <Button onClick={handleBecomeCreator} className="bg-primary hover:bg-primary/90">
                    <ChefHat className="w-4 h-4 mr-2" />
                    {dict.userProfile.becomeCreator.cta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* ✅ MODAL LOCATION SELECTOR - COPIADO DEL CHECKOUT */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <LocationSelector
              onLocationSelected={handleCreatorLocationSelected}
              onCancel={() => {
                console.log('❌ Profile: LocationSelector cancelado');
                setShowLocationSelector(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
