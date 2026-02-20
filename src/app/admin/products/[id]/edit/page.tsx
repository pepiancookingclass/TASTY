'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
import { useAuth } from '@/providers/auth-provider';
import { getProductById, updateProduct } from '@/lib/services/products';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import { Switch } from '@/components/ui/switch';
import { FormDescription } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';

const formSchema = z.object({
  productName_en: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  productName_es: z.string().min(2, { message: 'El nombre del producto debe tener al menos 2 caracteres.' }),
  productImages: z.array(z.string()).optional(),
  isSoldOut: z.boolean().optional(),
  englishDescription: z.string().optional(),
  spanishDescription: z.string().optional(),
  productPrice: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  productType: z.enum(['pastry', 'dessert', 'savory', 'cookie', 'handmade', 'seasonal', 'other']),
  productIngredients_en: z.string().optional(),
  productIngredients_es: z.string().optional(),
  preparationTime: z.coerce.number().min(0).optional(),
  deliveryVehicle: z.enum(['moto', 'auto']).optional(),
});

const DRAFT_STORAGE_KEY_PREFIX = 'admin_product_edit_draft_';

export default function AdminEditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const { user } = useAuth();
  const { canAccessAdminPanel, loading: permissionsLoading } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const draftKey = `${DRAFT_STORAGE_KEY_PREFIX}${productId}`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName_en: '',
      productName_es: '',
      productImages: [],
      isSoldOut: false,
      productType: 'pastry',
      productIngredients_en: '',
      productIngredients_es: '',
      preparationTime: 1,
    },
  });

  const saveDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    const values = form.getValues();
    const draft = {
      ...values,
      savedAt: Date.now(),
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [form, draftKey]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(draftKey);
    setHasDraft(false);
  }, [draftKey]);

  const loadDraft = useCallback((): z.infer<typeof formSchema> | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(draftKey);
    if (!saved) return null;

    try {
      const draft = JSON.parse(saved);
      const hoursSinceSave = (Date.now() - draft.savedAt) / (1000 * 60 * 60);
      if (hoursSinceSave > 24) {
        localStorage.removeItem(draftKey);
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  }, [draftKey]);

  useEffect(() => {
    const subscription = form.watch(() => {
      saveDraft();
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  useEffect(() => {
    if (permissionsLoading) return;
    if (!canAccessAdminPanel) {
      router.push('/');
      return;
    }
  }, [permissionsLoading, canAccessAdminPanel, router]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        const product = await getProductById(productId);

        if (!product) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Producto no encontrado',
          });
          router.push('/admin/products');
          return;
        }

        const draft = loadDraft();

        if (draft) {
          setHasDraft(true);
          form.reset({
            productName_en: draft.productName_en,
            productName_es: draft.productName_es,
            productImages: draft.productImages || [],
            isSoldOut: draft.isSoldOut || false,
            productType: draft.productType,
            englishDescription: draft.englishDescription,
            spanishDescription: draft.spanishDescription,
            productIngredients_en: draft.productIngredients_en,
            productIngredients_es: draft.productIngredients_es,
            preparationTime: draft.preparationTime,
            productPrice: draft.productPrice,
          });
          toast({
            title: 'Borrador restaurado',
            description: 'Se recuperaron tus cambios anteriores.',
          });
        } else {
          form.reset({
            productName_en: product.name.en,
            productName_es: product.name.es,
            productImages: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [],
            isSoldOut: product.isSoldOut || false,
            productType: product.type,
            englishDescription: product.description.en,
            spanishDescription: product.description.es,
            productIngredients_en: product.ingredients.en,
            productIngredients_es: product.ingredients.es,
            preparationTime: product.preparationTime,
            productPrice: product.price,
            deliveryVehicle: product.deliveryVehicle || 'moto',
          });
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar el producto',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProduct();
    }
  }, [productId, user, form, router, toast, loadDraft]);

  const handleDiscardDraft = async () => {
    clearDraft();
    setIsLoading(true);

    const product = await getProductById(productId);
    if (product) {
      form.reset({
        productName_en: product.name.en,
        productName_es: product.name.es,
        productImages: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [],
        isSoldOut: product.isSoldOut || false,
        productType: product.type,
        englishDescription: product.description.en,
        spanishDescription: product.description.es,
        productIngredients_en: product.ingredients.en,
        productIngredients_es: product.ingredients.es,
        preparationTime: product.preparationTime,
        productPrice: product.price,
      });
      toast({
        title: 'Borrador descartado',
        description: 'Se cargaron los datos originales del producto.',
      });
    }
    setIsLoading(false);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const imageUrls = values.productImages && values.productImages.length > 0 ? values.productImages : [];

      const updated = await updateProduct(productId, {
        name: {
          en: values.productName_en,
          es: values.productName_es,
        },
        type: values.productType,
        price: values.productPrice,
        imageUrls: imageUrls,
        imageUrl: imageUrls[0] || '',
        description: {
          en: values.englishDescription || '',
          es: values.spanishDescription || '',
        },
        ingredients: {
          en: values.productIngredients_en || '',
          es: values.productIngredients_es || '',
        },
        preparationTime: values.preparationTime || 1,
        isSoldOut: values.isSoldOut || false,
        deliveryVehicle: values.deliveryVehicle || 'moto',
      });

      if (updated) {
        clearDraft();
        toast({
          title: 'Producto actualizado',
          description: 'Los cambios han sido guardados.',
        });
        router.push('/admin/products');
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el producto.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canAccessAdminPanel) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline text-2xl">Editar Producto (Admin)</CardTitle>
                  <CardDescription>Modifica los detalles del producto</CardDescription>
                </div>
                {hasDraft && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Save className="h-3 w-3" />
                      Borrador guardado
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDiscardDraft}
                    >
                      Descartar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="productName_en" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.creatorProducts.new.details.name_en}</FormLabel>
                  <FormControl><Input placeholder={dict.creatorProducts.new.details.name_en_placeholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="productName_es" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.creatorProducts.new.details.name_es}</FormLabel>
                  <FormControl><Input placeholder={dict.creatorProducts.new.details.name_es_placeholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="productImages" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.creatorProducts.new.details.image}</FormLabel>
                  <FormControl>
                    <MultiImageUpload
                      value={field.value || []}
                      onChange={field.onChange}
                      folder="products"
                      maxImages={6}
                    />
                  </FormControl>
                  <FormDescription>
                    Sube hasta 6 imágenes. La primera será la portada del producto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isSoldOut" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Producto Agotado</FormLabel>
                    <FormDescription>
                      Marca este producto como agotado/vendido temporalmente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="englishDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.creatorProducts.new.details.description_en}</FormLabel>
                  <FormControl><Textarea placeholder={dict.creatorProducts.new.details.description_en_placeholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="spanishDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.creatorProducts.new.details.description_es}</FormLabel>
                  <FormControl><Textarea placeholder={dict.creatorProducts.new.details.description_es_placeholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="productPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.creatorProducts.new.details.price}</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder={dict.creatorProducts.new.details.price_placeholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="productType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.creatorProducts.new.details.type}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dict.creatorProducts.new.details.type_placeholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pastry">{dict.creatorProducts.new.details.type_pastry}</SelectItem>
                        <SelectItem value="dessert">{dict.creatorProducts.new.details.type_dessert}</SelectItem>
                        <SelectItem value="savory">{dict.creatorProducts.new.details.type_savory}</SelectItem>
                        <SelectItem value="cookie">{dict.creatorProducts.new.details.type_cookie}</SelectItem>
                        <SelectItem value="handmade">{dict.creatorProducts.new.details.type_handmade}</SelectItem>
                        <SelectItem value="seasonal">{dict.creatorProducts.new.details.type_seasonal}</SelectItem>
                        <SelectItem value="other">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="preparationTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Preparación (horas)</FormLabel>
                    <FormControl><Input type="number" min="0" placeholder="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="deliveryVehicle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Medio de Entrega</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'moto'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el medio de entrega" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="moto">🏍️ Moto (productos pequeños/medianos)</SelectItem>
                      <SelectItem value="auto">🚗 Auto (productos grandes/frágiles)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecciona auto si el producto es grande, frágil o requiere más espacio. Los productos de moto tienen tarifas de delivery más económicas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="productIngredients_en" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.creatorProducts.new.details.ingredients_en}</FormLabel>
                  <FormControl><Textarea placeholder={dict.creatorProducts.new.details.ingredients_en_placeholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="productIngredients_es" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.creatorProducts.new.details.ingredients_es}</FormLabel>
                  <FormControl><Textarea placeholder={dict.creatorProducts.new.details.ingredients_es_placeholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

