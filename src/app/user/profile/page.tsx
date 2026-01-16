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
    instagram: '', // NUEVO CAMPO
    skills: [] as Skill[],
    workspacePhotos: [] as string[],
    street: '',
    city: '',
    state: '', // Departamento
    zip: '',
    country: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
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
    deliveryRadius: 25,
    baseFee: 25.00,
    perKmFee: 3.00
  });
  
  const finalCreatorLocation = creatorGPSLocation || creatorManualLocation;

  const isCreator = roles.includes('creator');

  // Cargar datos UNA SOLA VEZ al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser) {
        router.push('/login');
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
            instagram: userData.instagram || '', // NUEVO CAMPO
            skills: userData.skills || [],
            workspacePhotos: userData.workspace_photos || [],
            street: userData.address_street || '',
            city: userData.address_city || '',
            state: userData.address_state || '', // Departamento
            zip: userData.address_zip || '',
            country: userData.address_country || ''
          };
          
          console.warn('📝 DATOS CARGADOS:', JSON.stringify(newFormData, null, 2));
          setFormData(newFormData);
          
          // ✅ CARGAR CONFIGURACIÓN DE DELIVERY DEL CREADOR
          if (isCreator && userData) {
            setCreatorDeliveryConfig({
              latitude: userData.creator_latitude,
              longitude: userData.creator_longitude,
              address: userData.creator_address || '',
              deliveryRadius: userData.creator_delivery_radius || 25,
              baseFee: userData.creator_base_delivery_fee || 25.00,
              perKmFee: userData.creator_per_km_fee || 3.00
            });
            console.log('🚚 Profile: Configuración delivery cargada:', {
              lat: userData.creator_latitude,
              lng: userData.creator_longitude,
              address: userData.creator_address,
              radius: userData.creator_delivery_radius
            });
          }
          
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
  }, []); // Sin dependencias - solo se ejecuta una vez

  // Función simple para actualizar campos
  const updateField = (field: string, value: any) => {
    console.warn(`🔄 ACTUALIZANDO CAMPO: ${field} =`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        address_zip: formData.zip,
        address_country: formData.country,
        ...(isCreator && { 
          skills: formData.skills, 
          workspace_photos: formData.workspacePhotos,
          // ✅ GUARDAR CONFIGURACIÓN DE DELIVERY
          creator_latitude: creatorDeliveryConfig.latitude,
          creator_longitude: creatorDeliveryConfig.longitude,
          creator_address: creatorDeliveryConfig.address,
          creator_delivery_radius: creatorDeliveryConfig.deliveryRadius,
          creator_base_delivery_fee: creatorDeliveryConfig.baseFee,
          creator_per_km_fee: creatorDeliveryConfig.perKmFee
        })
      };

      console.log('💾 Profile: Guardando datos del creador:', dataToSave);

      const { error } = await supabase
        .from('users')
        .upsert(dataToSave);

      if (error) throw error;

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
      <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>
      
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
              <CardTitle>Información del Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveChanges}>
                <div className="space-y-6">
                  {/* Información Personal */}
                  <div>
                    <h3 className="font-headline text-lg mb-4">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input 
                          id="name" 
                          value={formData.displayName} 
                          onChange={e => updateField('displayName', e.target.value)}
                          disabled={isSaving}
                          placeholder="Escribe tu nombre aquí..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={formData.email} 
                          onChange={e => updateField('email', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Número de Teléfono</Label>
                        <Input 
                          id="phone" 
                          value={formData.phone} 
                          onChange={e => updateField('phone', e.target.value)}
                          disabled={isSaving}
                          placeholder="+502 1234-5678"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Habilidades de Creador */}
                  {isCreator && (
                    <>
                      <div>
                        <h3 className="font-headline text-lg mb-4">Mis Habilidades de Creador</h3>
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
                            <Label htmlFor="pastry">Repostería y Postres</Label>
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
                            <Label htmlFor="savory">Platos Salados</Label>
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
                            <Label htmlFor="handmade">Artesanías</Label>
                          </div>
                        </div>
                        
                        {/* Instagram solo para creadores */}
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="instagram">Instagram del negocio (opcional)</Label>
                          <Input 
                            id="instagram" 
                            value={formData.instagram} 
                            onChange={e => updateField('instagram', e.target.value)}
                            disabled={isSaving}
                            placeholder="@tu_negocio"
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Fotos del Espacio de Trabajo */}
                      <div>
                        <h3 className="font-headline text-lg mb-4">📸 Fotos de tu Espacio de Trabajo</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Muestra a tus clientes dónde creas tus productos. Sube fotos de tu cocina, taller, herramientas, etc.
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

                  {/* Opción para convertirse en Creador */}
                  {!isCreator && (
                    <>
                      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <ChefHat className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-headline text-lg mb-2">¡Únete a nuestros Creadores!</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Vende tus productos artesanales, recibe 90% de las ganancias y forma parte de la comunidad TASTY.
                            </p>
                            <Button onClick={handleBecomeCreator} className="bg-primary hover:bg-primary/90">
                              <ChefHat className="w-4 h-4 mr-2" />
                              Solicitar ser Creador
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Dirección de Entrega */}
                  <div>
                    <h3 className="font-headline text-lg mb-4">Dirección de Entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Dirección</Label>
                        <Input 
                          id="street" 
                          value={formData.street} 
                          onChange={e => updateField('street', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Departamento</Label>
                        <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={isSaving}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Guatemala">Guatemala</SelectItem>
                            <SelectItem value="Sacatepéquez">Sacatepéquez</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Municipio</Label>
                        <Select value={formData.city} onValueChange={(value) => updateField('city', value)} disabled={isSaving || !selectedDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedDepartment ? "Selecciona un municipio" : "Primero selecciona un departamento"} />
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
                        <Label htmlFor="zip">Código Postal</Label>
                        <Input 
                          id="zip" 
                          value={formData.zip} 
                          onChange={e => updateField('zip', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
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
                        <h3 className="font-headline text-lg mb-4">📍 Dirección de tu Lugar Creador</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configura desde dónde salen tus pedidos para calcular entregas correctamente
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
                                  Obteniendo ubicación...
                                </>
                              ) : (
                                <>
                                  <MapPin className="mr-2 h-4 w-4" />
                                  📍 Usar mi ubicación actual
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
                              📌 Seleccionar en mapa
                            </Button>
                          </div>
                          
                          {locationError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                              ❌ {locationError}
                              <p className="mt-2 text-xs">
                                💡 Puedes usar la opción "Seleccionar en mapa" si no puedes compartir tu ubicación.
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
                                    📍 Ubicación de entrega configurada
                                  </h4>
                                  <p className="text-sm text-green-700">
                                    Lat: {creatorDeliveryConfig.latitude.toFixed(6)}, Lng: {creatorDeliveryConfig.longitude.toFixed(6)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Configuración de delivery */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>📏 Radio de Entrega (km)</Label>
                              <Input 
                                type="number" 
                                value={creatorDeliveryConfig.deliveryRadius} 
                                onChange={(e) => setCreatorDeliveryConfig(prev => ({
                                  ...prev,
                                  deliveryRadius: parseInt(e.target.value) || 25
                                }))}
                                placeholder="25"
                                disabled={isSaving}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>💰 Tarifa Base (Q)</Label>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={creatorDeliveryConfig.baseFee} 
                                onChange={(e) => setCreatorDeliveryConfig(prev => ({
                                  ...prev,
                                  baseFee: parseFloat(e.target.value) || 25.00
                                }))}
                                placeholder="25.00"
                                disabled={isSaving}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>🚗 Por km extra (Q)</Label>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={creatorDeliveryConfig.perKmFee} 
                                onChange={(e) => setCreatorDeliveryConfig(prev => ({
                                  ...prev,
                                  perKmFee: parseFloat(e.target.value) || 3.00
                                }))}
                                placeholder="3.00"
                                disabled={isSaving}
                              />
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600">
                            💡 Los primeros 3km están incluidos en la tarifa base. El sistema calculará automáticamente el costo de entrega basado en la distancia desde tu ubicación.
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
                          Guardando...
                        </>
                      ) : (
                        'Guardar Cambios'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Configuración de Privacidad */}
          <PrivacySettings />
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
