'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useDictionary } from '@/hooks/useDictionary';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Check, X, ImageIcon } from 'lucide-react';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';

type Skill = 'pastry' | 'savory' | 'handmade';

export default function UserProfilePage() {
  const { user, loading } = useUser();
  const { user: authUser } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const router = useRouter();
  const dict = useDictionary();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workspacePhotos, setWorkspacePhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUserEditedData, setHasUserEditedData] = useState(false);
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');

  const isCreator = roles.includes('creator');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user && authUser && !hasUserEditedData) {
      console.warn('👤 DATOS DEL USUARIO:', JSON.stringify({ 
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          phone: user.phone
        }, 
        authUser: {
          id: authUser.id,
          email: authUser.email
        }
      }, null, 2));
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setProfilePictureUrl(user.photoURL || '');
      console.warn('📝 Estados iniciales:', JSON.stringify({ 
        displayName: user.displayName, 
        email: user.email, 
        profilePictureUrl: user.photoURL 
      }, null, 2));
      
      // Obtener datos adicionales del usuario desde Supabase
      const getUserData = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (data && !error) {
          setSkills(data.skills || []);
          setPhone(data.phone || '');
          setProfilePictureUrl(data.profile_picture_url || user.photoURL || '');
          setStreet(data.address_street || '');
          setCity(data.address_city || '');
          setState(data.address_state || '');
          setZip(data.address_zip || '');
          setCountry(data.address_country || '');
          setWorkspacePhotos(data.workspace_photos || []);
        }
      };
      getUserData();
    }
  }, [user, loading, router, authUser, hasUserEditedData]);

  // Paso 1: Seleccionar archivo y mostrar preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Solo se permiten imágenes JPG, PNG o WebP',
      });
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La imagen no puede superar 5MB',
      });
      return;
    }

    // Crear preview local
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setSelectedFile(file);
  };

  // Paso 2: Cancelar preview
  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Paso 3: Confirmar y subir foto - IGUAL que workspace (que sí funciona)
  const handleConfirmUpload = async () => {
    if (!selectedFile || !authUser) return;

    setIsUploadingPhoto(true);
    console.warn('🔄 INICIANDO UPLOAD DE FOTO DE PERFIL');
    console.warn('📁 Archivo seleccionado:', selectedFile.name, selectedFile.size, selectedFile.type);
    console.warn('👤 Usuario ID:', authUser.id);

    try {
      // Mismo sistema que workspace: timestamp-random.ext
      const ext = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `profiles/${fileName}`;
      
      console.warn('📂 Ruta del archivo:', filePath);
      console.warn('🏗️ Subiendo a bucket "images"...');

      // Subir igual que workspace
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, selectedFile);

      console.warn('📤 Resultado del upload:', JSON.stringify({ uploadData, uploadError }, null, 2));

      if (uploadError) {
        console.error('❌ ERROR EN UPLOAD:', uploadError);
        throw uploadError;
      }

      // URL pública
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      console.warn('🔗 URL pública generada:', data.publicUrl);

      // Guardar en DB
      console.warn('💾 Guardando URL en base de datos...');
      console.warn('💾 URL a guardar:', data.publicUrl);
      console.warn('💾 Usuario ID:', authUser.id);
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: data.publicUrl })
        .eq('id', authUser.id);

      console.warn('💾 Resultado update DB:', JSON.stringify({ updateData, updateError }, null, 2));
      
      if (updateError) {
        console.error('❌ ERROR EN UPDATE DB:', updateError);
        throw updateError;
      } else {
        console.warn('✅ URL guardada exitosamente en DB');
      }

      if (updateError) {
        console.error('❌ ERROR EN UPDATE DB:', updateError);
        throw updateError;
      }

      // Actualizar la URL en el estado local
      setProfilePictureUrl(data.publicUrl);
      console.warn('🔄 Actualizando foto en interfaz:', data.publicUrl);
      
      toast({ title: '✅ Foto actualizada correctamente' });
      handleCancelPreview();
      
      // Forzar re-render del avatar
      setTimeout(() => {
        console.warn('🔄 Forzando actualización de interfaz');
        setProfilePictureUrl(data.publicUrl + '?t=' + Date.now());
      }, 500);
      
      console.log('✅ UPLOAD COMPLETADO EXITOSAMENTE');
    } catch (error: any) {
      console.error('💥 ERROR COMPLETO:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error details:', error.details);
      console.error('💥 Error hint:', error.hint);
      toast({
        variant: 'destructive',
        title: 'Error al subir foto',
        description: `${error.message || 'Error desconocido'} - Revisa la consola para más detalles`,
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSkillChange = (skill: Skill, checked: boolean) => {
    setSkills(prev => 
      checked ? [...prev, skill] : prev.filter(s => s !== skill)
    );
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    setIsSaving(true);
    console.warn('💾 INICIANDO GUARDADO DE PERFIL');
    console.warn('👤 Usuario ID:', authUser.id);
    console.warn('📝 Datos a guardar:', JSON.stringify({
      name: displayName,
      email: email,
      phone: phone,
      profile_picture_url: profilePictureUrl,
      address_street: street,
      address_city: city,
      address_state: state,
      address_zip: zip,
      address_country: country,
      isCreator,
      skills: isCreator ? skills : undefined,
      workspace_photos: isCreator ? workspacePhotos : undefined
    }, null, 2));

    try {
      // Limpiar URL de query strings (?t=...)
      const cleanUrl = profilePictureUrl.split('?')[0];
      console.warn('🧹 URL limpia:', cleanUrl);
      
      const dataToSave = { 
        id: authUser.id,
        name: displayName, 
        email: email,
        phone: phone,
        profile_picture_url: cleanUrl || null,
        address_street: street,
        address_city: city,
        address_state: state,
        address_zip: zip,
        address_country: country,
        ...(isCreator && { skills, workspace_photos: workspacePhotos }) 
      };

      console.warn('📤 Enviando a Supabase:', JSON.stringify(dataToSave, null, 2));

      const { data, error } = await supabase
        .from('users')
        .upsert(dataToSave);
      
      console.warn('📥 Respuesta de Supabase:', JSON.stringify({ data, error }, null, 2));
      
      if (error) {
        console.error('❌ ERROR EN UPSERT:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        throw error;
      }
      
      console.warn('✅ PERFIL GUARDADO EXITOSAMENTE');
      toast({
        title: '✅ Perfil guardado',
        description: 'Todos los cambios se han guardado correctamente',
      });
    } catch (error: any) {
      console.error("💥 ERROR COMPLETO AL GUARDAR:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar perfil",
        description: `${error?.message || error?.details || 'Error desconocido'} - Revisa la consola para más detalles`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBecomeCreator = async () => {
    if (!authUser) return;
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', authUser.id)
        .single();
      
      const currentRoles = userData?.roles || [];
      
      if (!currentRoles.includes('creator')) {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            roles: [...currentRoles, 'creator']
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "¡Ahora eres un Creador!",
        description: "El Panel de Creador ahora está disponible en el menú.",
      });
      
      // Recargar la página para actualizar los roles
      window.location.reload();
    } catch (error) {
      console.error("Error becoming a creator: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu rol. Intenta de nuevo.",
      });
    }
  }

  if (loading || !user) {
    return <div className="container flex justify-center items-center h-screen"><p>{dict.loading}</p></div>;
  }

  const skillOptions: {id: Skill, label: keyof typeof dict.creatorSkills}[] = [
    { id: 'pastry', label: 'pastry' },
    { id: 'savory', label: 'savory' },
    { id: 'handmade', label: 'handmade' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-4xl font-bold mb-8">{dict.userProfile.title}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              {previewUrl ? (
                /* Preview usa img nativo para blob URLs */
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-amber-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Avatar className="h-24 w-24 border-2 border-muted">
                  <AvatarImage src={profilePictureUrl || undefined} alt={displayName || ''} />
                  <AvatarFallback className="text-2xl">{(displayName || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Si hay preview, mostrar botones de confirmar/cancelar */}
              {previewUrl ? (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="default"
                    className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmUpload}
                    disabled={isUploadingPhoto}
                    title="Confirmar foto"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full"
                    onClick={handleCancelPreview}
                    disabled={isUploadingPhoto}
                    title="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  title="Cambiar foto"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div>
              <CardTitle className="font-headline text-2xl">{displayName || 'Usuario'}</CardTitle>
              <p className="text-muted-foreground">{email}</p>
              {roles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Roles: {roles.join(', ')}
                </p>
              )}
              {previewUrl && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Previsualización - confirma para guardar
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveChanges}>
            <div className="space-y-6">
              <div>
                <h3 className="font-headline text-lg mb-4">{dict.userProfile.personalInfo.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{dict.userProfile.personalInfo.name}</Label>
                    <Input 
                      id="name" 
                      value={displayName} 
                      onChange={e => {
                        console.warn('📝 Cambiando nombre:', e.target.value);
                        setDisplayName(e.target.value);
                        setHasUserEditedData(true);
                      }}
                      disabled={isSaving}
                      placeholder="Escribe tu nombre aquí..."
                    />
                    {/* DEBUG INFO */}
                    <div style={{fontSize: '10px', color: 'red'}}>
                      DEBUG: isSaving={isSaving.toString()}, hasUserEditedData={hasUserEditedData.toString()}, displayName="{displayName}"
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{dict.userProfile.personalInfo.email}</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{dict.userProfile.personalInfo.phone}</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+502 1234-5678" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {rolesLoading ? (
                <p>Cargando rol...</p>
              ) : isCreator ? (
                <>
                  <div>
                    <h3 className="font-headline text-lg mb-4">{dict.userProfile.skills.title}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {skillOptions.map(skill => (
                        <div key={skill.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={skill.id} 
                            checked={skills.includes(skill.id)}
                            onCheckedChange={(checked) => handleSkillChange(skill.id, !!checked)}
                          />
                          <Label htmlFor={skill.id} className="font-normal">{dict.creatorSkills[skill.label]}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-headline text-lg">Fotos de tu Espacio de Trabajo</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Muestra a tus clientes dónde creas tus productos. Sube fotos de tu cocina, taller, herramientas, etc.
                    </p>
                    <MultiImageUpload
                      values={workspacePhotos}
                      onChange={setWorkspacePhotos}
                      maxImages={5}
                      folder="workspace"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="font-headline text-lg mb-2">¡Únete a nuestros Creadores!</h3>
                  <p className="text-muted-foreground mb-4">
                    ¿Quieres vender tus propios productos caseros? Conviértete en creador para acceder a tu propio panel.
                  </p>
                  <Button type="button" onClick={handleBecomeCreator}>
                    Convertirme en Creador
                  </Button>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="font-headline text-lg mb-4">{dict.userProfile.address.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">{dict.userProfile.address.street}</Label>
                    <Input 
                      id="street" 
                      placeholder="Calle, Avenida, Zona..." 
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{dict.userProfile.address.city}</Label>
                    <Input 
                      id="city" 
                      placeholder="Ciudad de Guatemala"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">{dict.userProfile.address.state}</Label>
                    <Input 
                      id="state" 
                      placeholder="Guatemala"
                      value={state}
                      onChange={e => setState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">{dict.userProfile.address.zip}</Label>
                    <Input 
                      id="zip" 
                      placeholder="01010"
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{dict.userProfile.address.country}</Label>
                    <Input 
                      id="country" 
                      placeholder="Guatemala"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
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
    </div>
  );
}
