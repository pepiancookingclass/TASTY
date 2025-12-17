'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sampleChef } from "@/lib/data";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";

const formSchema = z.object({
  title_en: z.string().min(5, "Title must be at least 5 characters."),
  title_es: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description_en: z.string().min(10, "Description must be at least 10 characters."),
  description_es: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  productId: z.string({ required_error: "Please select a product." }),
  discountPercentage: z.coerce.number().min(1, "Discount must be at least 1%.").max(100, "Discount cannot exceed 100%."),
});

export function DiscountPromotionForm() {
    const { toast } = useToast();
    const { language } = useLanguage();
    // In a real app, we'd get the current chef's ID
    const chefProducts = products.filter(p => p.chefId === sampleChef.id);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title_en: "",
            title_es: "",
            description_en: "",
            description_es: "",
        }
    });


    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        const selectedProduct = products.find(p => p.id === values.productId);
        toast({
            title: "Discount Created!",
            description: `A ${values.discountPercentage}% discount for ${selectedProduct?.name[language]} has been saved (simulation).`,
        });
        form.reset();
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField control={form.control} name="title_en" render={({ field }) => (
            <FormItem>
                <FormLabel>Offer Title (English)</FormLabel>
                <FormControl><Input placeholder="e.g., Weekend Croissant Special" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        
        <FormField control={form.control} name="title_es" render={({ field }) => (
            <FormItem>
                <FormLabel>Título de la Oferta (Español)</FormLabel>
                <FormControl><Input placeholder="e.g., Especial de Croissants del Fin de Semana" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="description_en" render={({ field }) => (
            <FormItem>
                <FormLabel>Short Description (English)</FormLabel>
                <FormControl><Textarea placeholder="A brief summary of the offer..." {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

         <FormField control={form.control} name="description_es" render={({ field }) => (
            <FormItem>
                <FormLabel>Descripción Corta (Español)</FormLabel>
                <FormControl><Textarea placeholder="Un resumen breve de la oferta..." {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="productId" render={({ field }) => (
            <FormItem>
                <FormLabel>Product to Discount</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a product to discount" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {chefProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name[language]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="discountPercentage" render={({ field }) => (
            <FormItem>
                <FormLabel>Discount Percentage</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 15" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <Button type="submit" className="w-full">Create Discount</Button>
      </form>
    </Form>
  );
}
