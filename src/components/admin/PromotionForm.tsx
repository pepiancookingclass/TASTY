'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const formSchema = z.object({
  title_en: z.string().min(5, "Title must be at least 5 characters."),
  title_es: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description_en: z.string().min(10, "Description must be at least 10 characters."),
  description_es: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  promotionType: z.enum(['discount', 'free_item']),
  discountPercentage: z.coerce.number().optional(),
  freeItemId: z.string().optional(),
});

export function PromotionForm() {
    const { toast } = useToast();
    const { language } = useLanguage();
    const [promotionType, setPromotionType] = useState('discount');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title_en: "",
            title_es: "",
            description_en: "",
            description_es: "",
            promotionType: 'discount',
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (values.promotionType === 'discount' && !values.discountPercentage) {
            form.setError('discountPercentage', { message: 'Percentage is required for discounts.'});
            return;
        }
        if (values.promotionType === 'free_item' && !values.freeItemId) {
            form.setError('freeItemId', { message: 'Please select a free item.'});
            return;
        }

        console.log(values);
        toast({
            title: "Promotion Created!",
            description: `The new ${values.promotionType} promotion has been saved (simulation).`,
        });
        form.reset();
        setPromotionType('discount');
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField control={form.control} name="title_en" render={({ field }) => (
            <FormItem>
                <FormLabel>Offer Title (English)</FormLabel>
                <FormControl><Input placeholder="e.g., Summer Sale" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        
        <FormField control={form.control} name="title_es" render={({ field }) => (
            <FormItem>
                <FormLabel>Título de la Oferta (Español)</FormLabel>
                <FormControl><Input placeholder="e.g., Venta de Verano" {...field} /></FormControl>
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

        <FormField
          control={form.control}
          name="promotionType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Promotion Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                      field.onChange(value);
                      setPromotionType(value);
                  }}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="discount" />
                    </FormControl>
                    <FormLabel className="font-normal">Discount</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="free_item" />
                    </FormControl>
                    <FormLabel className="font-normal">Free Item</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {promotionType === 'discount' && (
             <FormField control={form.control} name="discountPercentage" render={({ field }) => (
                <FormItem>
                    <FormLabel>Discount Percentage (%)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 20" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        )}

        {promotionType === 'free_item' && (
             <FormField control={form.control} name="freeItemId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Free Item</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select the free item" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>{product.name[language]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>The item a customer gets for free.</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
        )}

        <Button type="submit" className="w-full">Create Offer</Button>
      </form>
    </Form>
  );
}
