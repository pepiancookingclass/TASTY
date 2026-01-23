'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/useDictionary";
import { useAuth } from "@/providers/auth-provider";
import { getProductById, updateProduct } from "@/lib/services/products";
import { ImageUpload } from "@/components/ui/image-upload";
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

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
});

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    },
  });

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
          router.push('/creator/products');
          return;
        }

        // Verificar que el producto pertenece al usuario
        if (product.creatorId !== user?.id) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No tienes permiso para editar este producto',
          });
          router.push('/creator/products');
          return;
        }

        // Llenar el formulario
        form.reset({
          productName_en: product.name.en,
          productName_es: product.name.es,
          productImage: product.imageUrl,
          productType: product.type,
          englishDescription: product.description.en,
          spanishDescription: product.description.es,
          productIngredients_en: product.ingredients.en,
          productIngredients_es: product.ingredients.es,
          preparationTime: product.preparationTime,
          productPrice: product.price,
        });
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
  }, [productId, user, form, router, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const updated = await updateProduct(productId, {
        name: {
          en: values.productName_en,
          es: values.productName_es,
        },
        type: values.productType,
        price: values.productPrice,
        imageUrl: values.productImage || '',
        description: {
          en: values.englishDescription || '',
          es: values.spanishDescription || '',
        },
        ingredients: {
          en: values.productIngredients_en || '',
          es: values.productIngredients_es || '',
        },
        preparationTime: values.preparationTime || 1,
      });

      if (updated) {
        toast({
          title: 'Producto actualizado',
          description: 'Los cambios han sido guardados.',
        });
        router.push('/creator/products');
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

  if (isLoading) {
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

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/creator/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Editar Producto</CardTitle>
              <CardDescription>Modifica los detalles de tu producto</CardDescription>
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

