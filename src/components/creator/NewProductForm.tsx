'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { generateProductDescriptionsAction } from "@/app/actions";
import { useTransition, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/useDictionary";
import { useAuth } from "@/providers/auth-provider";
import { createProduct } from "@/lib/services/products";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ui/image-upload";

const formSchema = z.object({
  productName_en: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  productName_es: z.string().min(2, { message: "El nombre del producto debe tener al menos 2 caracteres." }),
  productImage: z.string().optional(),
  englishDescription: z.string().optional(),
  spanishDescription: z.string().optional(),
  productPrice: z.coerce.number().positive({ message: "Price must be a positive number." }),
  productType: z.enum(['pastry', 'dessert', 'savory', 'cookie', 'handmade']),
  productIngredients_en: z.string().optional(),
  productIngredients_es: z.string().optional(),
  preparationTime: z.coerce.number().min(0).optional(),
  isGlutenFree: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isDairyFree: z.boolean().optional(),
  isNutFree: z.boolean().optional(),
});

export function NewProductForm() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const dict = useDictionary();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName_en: "",
      productName_es: "",
      productImage: "",
      productType: "pastry",
      productIngredients_en: "",
      productIngredients_es: "",
      preparationTime: 1,
      isGlutenFree: false,
      isVegan: false,
      isDairyFree: false,
      isNutFree: false,
    },
  });

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
        title: dict.creatorProductsForm?.loginErrorTitle ?? "Error",
        description: dict.creatorProductsForm?.loginErrorDesc ?? "Debes iniciar sesión para crear un producto.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const product = await createProduct({
        name: {
          en: values.productName_en,
          es: values.productName_es,
        },
        type: values.productType,
        price: values.productPrice,
        imageUrl: values.productImage || 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=400',
        imageHint: values.productName_en.toLowerCase(),
        description: {
          en: values.englishDescription || '',
          es: values.spanishDescription || '',
        },
        ingredients: {
          en: values.productIngredients_en || '',
          es: values.productIngredients_es || '',
        },
        creatorId: user.id,
        preparationTime: values.preparationTime || 1,
        dietaryFlags: {
          isGlutenFree: values.isGlutenFree || false,
          isVegan: values.isVegan || false,
          isDairyFree: values.isDairyFree || false,
          isNutFree: values.isNutFree || false,
        },
      });

      if (product) {
        toast({
          title: dict.creatorProducts.new.details.toast.submit_title,
          description: dict.creatorProductsForm?.successDesc ?? "Tu producto ha sido creado exitosamente.",
        });
        router.push('/creator/products');
      } else {
        throw new Error('Error al crear el producto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        variant: "destructive",
        title: dict.creatorProductsForm?.errorTitle ?? "Error",
        description: dict.creatorProductsForm?.errorDesc ?? "No se pudo crear el producto. Intenta de nuevo.",
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
                <CardTitle className="font-headline text-2xl">{dict.creatorProducts.new.details.title}</CardTitle>
                <CardDescription>{dict.creatorProducts.new.details.description}</CardDescription>
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

                <FormField control={form.control} name="productImage" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{dict.creatorProducts.new.details.image}</FormLabel>
                        <FormControl>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              folder="products"
                              aspectRatio="video"
                            />
                        </FormControl>
                        <FormMessage />
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
                dict.creatorProducts.new.details.submit
              )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
