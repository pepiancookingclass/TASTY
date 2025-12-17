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
import { useTransition } from "react";
import { Loader2, Wand2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/useDictionary";

const formSchema = z.object({
  productName_en: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  productName_es: z.string().min(2, { message: "El nombre del producto debe tener al menos 2 caracteres." }),
  productImage: z.any().refine(files => files?.length > 0, 'La imagen del producto es requerida.'),
  englishDescription: z.string().optional(),
  spanishDescription: z.string().optional(),
  productPrice: z.coerce.number().positive({ message: "Price must be a positive number." }),
  productType: z.enum(['pastry', 'dessert', 'savory', 'cookie', 'handmade']),
  productIngredients_en: z.string().optional(),
  productIngredients_es: z.string().optional(),
});

export function NewProductForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const dict = useDictionary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName_en: "",
      productName_es: "",
      productType: "pastry",
      productIngredients_en: "",
      productIngredients_es: "",
    },
  });
  
  const imageRef = form.register("productImage");


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
        productName: productName_en, // AI primarily works with english for now
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: dict.creatorProducts.new.details.toast.submit_title,
      description: dict.creatorProducts.new.details.toast.submit_desc,
    });
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

                <FormField
                  control={form.control}
                  name="productImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.creatorProducts.new.details.image}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                            <Input id="productImage" type="file" {...imageRef} className="flex-1" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                </SelectContent>
                            </Select>
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
            <Button type="submit">{dict.creatorProducts.new.details.submit}</Button>
        </div>
      </form>
    </Form>
  );
}
