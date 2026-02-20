'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Creator, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { useDictionary } from '@/hooks/useDictionary';
import { useLanguage } from '@/hooks/useLanguage';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';
import { 
  MapPin, 
  Utensils, 
  Brush, 
  Sparkles, 
  ChevronLeft,
  ChevronRight,
  X,
  Images,
  Instagram
} from 'lucide-react';

export default function CreatorProfilePage() {
  const params = useParams();
  const creatorId = params.id as string;
  const dict = useDictionary();
  const { language } = useLanguage();
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [workspacePhotos, setWorkspacePhotos] = useState<string[]>([]);
  const [instagram, setInstagram] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const skillLabels: Record<string, string> = {
    pastry: dict.creatorSkills.pastry,
    savory: dict.creatorSkills.savory,
    handmade: dict.creatorSkills.handmade,
  };

  const skillIcons: Record<string, React.ReactNode> = {
    pastry: <Sparkles className="h-4 w-4" />,
    savory: <Utensils className="h-4 w-4" />,
    handmade: <Brush className="h-4 w-4" />,
  };

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        // Obtener datos del creador
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', creatorId)
          .single();

        if (userError || !userData) {
          console.error('Error fetching creator:', userError);
          setLoading(false);
          return;
        }

        const creatorData: Creator = {
          id: userData.id,
          name: userData.name || 'Creador',
          profilePictureUrl: userData.profile_picture_url || '/placeholder-avatar.png',
          imageHint: userData.name?.toLowerCase() || 'creator',
          hasDelivery: userData.has_delivery || false,
          skills: userData.skills || [],
          gender: userData.gender || 'female',
        };

        setCreator(creatorData);
        setWorkspacePhotos(userData.workspace_photos || []);
        setInstagram(userData.instagram || null);

        // Obtener productos del creador
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false });

        if (!productsError && productsData) {
          const transformedProducts: Product[] = productsData.map((p: any) => {
            const imageUrls = p.image_urls && p.image_urls.length > 0 
              ? p.image_urls 
              : p.image_url ? [p.image_url] : [];
            
            return {
              id: p.id,
              name: { en: p.name_en, es: p.name_es },
              type: p.type,
              price: parseFloat(p.price),
              imageUrl: imageUrls[0] || p.image_url || '',
              imageUrls: imageUrls,
              imageHint: p.image_hint || '',
              description: { en: p.description_en || '', es: p.description_es || '' },
              ingredients: { en: p.ingredients_en || '', es: p.ingredients_es || '' },
              creatorId: p.creator_id,
              preparationTime: p.preparation_time || 0,
              dietaryFlags: {
                isGlutenFree: p.is_gluten_free || false,
                isVegan: p.is_vegan || false,
                isDairyFree: p.is_dairy_free || false,
                isNutFree: p.is_nut_free || false,
              },
              isSoldOut: p.is_sold_out || false,
            };
          });
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (creatorId) {
      fetchCreator();
    }
  }, [creatorId]);

  const openLightbox = (index: number) => setSelectedPhotoIndex(index);
  const closeLightbox = () => setSelectedPhotoIndex(null);
  const nextPhoto = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % workspacePhotos.length);
    }
  };
  const prevPhoto = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + workspacePhotos.length) % workspacePhotos.length);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Skeleton className="h-80 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-40 rounded-lg mb-4" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Creador no encontrado</h1>
        <Button asChild>
          <Link href="/creators">Ver todos los creadores</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{dict.siteHeader.home}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/creators">{dict.siteHeader.creators}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{creator.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Columna izquierda - Info del creador */}
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {creator.profilePictureUrl && creator.profilePictureUrl.startsWith('http') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={creator.profilePictureUrl}
                    alt={creator.name}
                    width={150}
                    height={150}
                    className={cn(
                      "rounded-full aspect-square object-cover border-4",
                      creator.gender === 'female' ? 'border-primary' : 'border-blue-400'
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-[150px] h-[150px] rounded-full flex items-center justify-center text-4xl font-bold bg-muted border-4",
                    creator.gender === 'female' ? 'border-primary' : 'border-blue-400'
                  )}>
                    {creator.name.charAt(0)}
                  </div>
                )}
              </div>
              <CardTitle className="font-headline text-2xl">{creator.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Skills */}
              {creator.skills && creator.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Especialidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {creator.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skillIcons[skill]}
                        {skillLabels[skill] || skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery */}
              {creator.hasDelivery && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Ofrece delivery</span>
                </div>
              )}

              {/* Stats */}
              <div className="pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Productos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Fotos y productos */}
        <div className="md:col-span-2 space-y-8">
          {/* Fotos del espacio de trabajo */}
          {workspacePhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-5 w-5" />
                  Mi Espacio de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {workspacePhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => openLightbox(index)}
                      className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                    >
                      <Image
                        src={photo}
                        alt={`Espacio de trabajo ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram */}
          {instagram && (
            <a
              href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-lg text-white hover:opacity-90 transition-opacity"
            >
              <Instagram className="h-6 w-6" />
              <div>
                <p className="font-medium">Sígueme en Instagram</p>
                <p className="text-sm opacity-90">
                  {instagram.startsWith('http') 
                    ? instagram.split('/').pop() 
                    : instagram.startsWith('@') ? instagram : `@${instagram}`}
                </p>
              </div>
            </a>
          )}

          {/* Productos */}
          <div>
            <h2 className="font-headline text-2xl font-bold mb-6">
              Productos de {creator.name}
            </h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} creator={creator} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    Este creador aún no tiene productos publicados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox para fotos */}
      {selectedPhotoIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeft className="h-12 w-12" />
          </button>
          
          <div 
            className="relative max-w-4xl max-h-[80vh] w-full h-full m-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={workspacePhotos[selectedPhotoIndex]}
              alt={`Foto ${selectedPhotoIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronRight className="h-12 w-12" />
          </button>
          
          <div className="absolute bottom-4 text-white text-sm">
            {selectedPhotoIndex + 1} / {workspacePhotos.length}
          </div>
        </div>
      )}
    </div>
  );
}

