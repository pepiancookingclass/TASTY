'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateProductDescriptionsAction } from "@/app/actions";
import { useTransition, useState, useEffect, useCallback } from "react";
import { Loader2, Wand2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/useDictionary";
import { useAuth } from "@/providers/auth-provider";
import { createProduct } from "@/lib/services/products";
import { useRouter } from "next/navigation";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface Creator {
  id: string;
  name: string;
  email: string;
}

const formSchema = z.object({
  creatorId: z.string().min(1, { message: "Debes seleccionar un creador." }),
  productName_en: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  productName_es: z.string().min(2, { message: "El nombre del producto debe tener al menos 2 caracteres." }),
  productImages: z.array(z.string()).optional(),
  isSoldOut: z.boolean().optional(),
  englishDescription: z.string().optional(),
  spanishDescription: z.string().optional(),
  productPrice: z.coerce.number().positive({ message: "Price must be a positive number." }),
  productType: z.enum(['pastry', 'dessert', 'savory', 'cookie', 'handmade', 'seasonal', 'other']),
  productIngredients_en: z.string().optional(),
  productIngredients_es: z.string().optional(),
  preparationTime: z.coerce.number().min(0).optional(),
  isGlutenFree: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isDairyFree: z.boolean().optional(),
  isNutFree: z.boolean().optional(),
  deliveryVehicle: z.enum(['moto', 'auto']).optional(),
});

const ADMIN_NEW_PRODUCT_DRAFT_KEY = 'admin_new_product_draft';

export function AdminNewProductForm() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const { toast } = useToast();
  const dict = useDictionary();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creatorId: "",
      productName_en: "",
      productName_es: "",
      productImages: [],
      isSoldOut: false,
      productType: "pastry",
      productIngredients_en: "",
      productIngredients_es: "",
      preparationTime: 1,
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: false,
      deliveryVehicle: "moto",
    },
  });

  useEffect(() => {
    const loadCreators = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, roles')
          .contains('roles', ['creator'])
          .order('name');

        if (error) throw error;

        setCreators(data || []);
      } catch (error) {
        console.error('Error loading creators:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los creadores",
        });
      } finally {
        setLoadingCreators(false);
      }
    };

    loadCreators();
  }, [toast]);

  const saveDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    const values = form.getValues();
    const hasContent = values.productName_en || values.productName_es || 
                       (values.productImages && values.productImages.length > 0);
    if (!hasContent) return;
    
    const draft = {
      ...values,
      savedAt: Date.now(),
    };
    localStorage.setItem(ADMIN_NEW_PRODUCT_DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
  }, [form]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_NEW_PRODUCT_DRAFT_KEY);
    setHasDraft(false);
  }, []);

  const loadDraft = useCallback((): z.infer<typeof formSchema> | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(ADMIN_NEW_PRODUCT_DRAFT_KEY);
    if (!saved) return null;
    
    try {
      const draft = JSON.parse(saved);
      const hoursSinceSave = (Date.now() - draft.savedAt) / (1000 * 60 * 60);
      if (hoursSinceSave > 24) {
        localStorage.removeItem(ADMIN_NEW_PRODUCT_DRAFT_KEY);
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setHasDraft(true);
      form.reset(draft);
      toast({
        title: 'Borrador restaurado',
        description: 'Se recuperaron tus cambios anteriores.',
      });
    }
  }, [loadDraft, form, toast]);

  useEffect(() => {
    const subscription = form.watch(() => {
      saveDraft();
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  const handleDiscardDraft = () => {
    clearDraft();
    form.reset({
      creatorId: "",
      productName_en: "",
      productName_es: "",
      productImages: [],
      isSoldOut: false,
      productType: "pastry",
      productIngredients_en: "",
      productIngredients_es: "",
      preparationTime: 1,
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: false,
      deliveryVehicle: "moto",
    });
    toast({
      title: 'Borrador descartado',
      description: 'El formulario ha sido limpiado.',
    });
  };

  const handleGenerateDescriptions = () => {
    const { productName_en, productType, productIngredients_en, productPrice } = form.getValues();
    if (!productName_en || !productType || !productPrice) {
      toast({
        variant: "destructive",
        title: dict.creatorProducts.new.details.toast.missing_info_title,
        description: dict.creatorProducts.new.details.toast.missing_info_desc,
      });
      return;
    }
    
    startTransition(async () => {
      const result = await generateProductDescriptionsAction({
        productName: productName_en,
        productType,
        productIngredients: productIngredients_en || '',
        productPrice,
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: dict.creatorProducts.new.details.toast.ai_fail_title,
          description: result.error,
        });
      } else if (result.data) {
        form.setValue("englishDescription", result.data.englishDescription);
        form.setValue("spanishDescription", result.data.spanishDescription);
        toast({
          title: dict.creatorProducts.new.details.toast.ai_success_title,
          description: dict.creatorProducts.new.details.toast.ai_success_desc,
        });
      }
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión.",
      });
      return;
    }

    if (!values.creatorId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar un creador.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const imageUrls = values.productImages && values.productImages.length > 0 
        ? values.productImages 
        : ['https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=400'];
      
      const product = await createProduct({
        name: {
          en: values.productName_en,
          es: values.productName_es,
        },
        type: values.productType,
        price: values.productPrice,
        imageUrl: imageUrls[0],
        imageUrls: imageUrls,
        imageHint: values.productName_en.toLowerCase(),
        description: {
          en: values.englishDescription || '',
          es: values.spanishDescription || '',
        },
        ingredients: {
          en: values.productIngredients_en || '',
          es: values.productIngredients_es || '',
        },
        creatorId: values.creatorId,
        preparationTime: values.preparationTime || 1,
        dietaryFlags: {
          isGlutenFree: values.isGlutenFree || false,
          isVegan: values.isVegan || false,
          isDairyFree: values.isDairyFree || false,
          isNutFree: values.isNutFree || false,
        },
        deliveryVehicle: values.deliveryVehicle || 'moto',
        isSoldOut: values.isSoldOut || false,
      });

      if (product) {
        clearDraft();
        toast({
          title: "Producto creado",
          description: "El producto ha sido creado exitosamente.",
        });
        router.push('/admin/products');
      } else {
        throw new Error('Error al crear el producto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el producto. Intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-2xl">Crear Producto para Creador</CardTitle>
                    <CardDescription>Selecciona un creador y completa los detalles del producto.</CardDescription>
                  </div>
                  {hasDraft && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Save className="h-3 w-3" />
                        Borrador
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
                <FormField control={form.control} name="creatorId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Creador *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={loadingCreators}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingCreators ? "Cargando creadores..." : "Selecciona un creador"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {creators.map((creator) => (
                                    <SelectItem key={creator.id} value={creator.id}>
                                        {creator.name} ({creator.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            El producto será asignado a este creador.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />

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

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <FormLabel>{dict.creatorProducts.new.details.descriptions}</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescriptions} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isPending ? dict.creatorProducts.new.details.generate_loading : dict.creatorProducts.new.details.generate}
                        </Button>
                    </div>
                </div>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value || 'moto'}>
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
                        <FormDescription>{dict.creatorProducts.new.details.ingredients_en_help}</FormDescription>
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
        
        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Producto"
              )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
