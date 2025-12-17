'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { products, sampleCreator } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { useDictionary } from "@/hooks/useDictionary";

const formSchema = z.object({
  title_en: z.string().min(5, "Title must be at least 5 characters."),
  title_es: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description_en: z.string().min(10, "Description must be at least 10 characters."),
  description_es: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  requiredProductId: z.string({ required_error: "Please select a product to purchase." }),
  freeProductId: z.string({ required_error: "Please select a free product to offer." }),
});

export function FreeItemPromotionForm() {
    const { toast } = useToast();
    const { language } = useLanguage();
    const dict = useDictionary();
    const creatorProducts = products.filter(p => p.creatorId === sampleCreator.id);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title_en: "",
            title_es: "",
            description_en: "",
            description_es: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: dict.freeItemForm.toast.title,
            description: dict.freeItemForm.toast.description,
        });
        form.reset();
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title_en" render={({ field }) => (
            <FormItem>
                <FormLabel>{dict.promotionForm.title_en.label}</FormLabel>
                <FormControl><Input placeholder={dict.freeItemForm.placeholders.title_en} {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="title_es" render={({ field }) => (
            <FormItem>
                <FormLabel>{dict.promotionForm.title_es.label}</FormLabel>
                <FormControl><Input placeholder={dict.freeItemForm.placeholders.title_es} {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="description_en" render={({ field }) => (
            <FormItem>
                <FormLabel>{dict.promotionForm.description_en.label}</FormLabel>
                <FormControl><Textarea placeholder={dict.freeItemForm.placeholders.description_en} {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="description_es" render={({ field }) => (
            <FormItem>
                <FormLabel>{dict.promotionForm.description_es.label}</FormLabel>
                <FormControl><Textarea placeholder={dict.freeItemForm.placeholders.description_es} {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        
        <FormField control={form.control} name="requiredProductId" render={({ field }) => (
            <FormItem>
                <FormLabel>{dict.freeItemForm.requiredProduct.label}</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={dict.freeItemForm.requiredProduct.placeholder} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {creatorProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name[language]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="freeProductId" render={({ field }) => (
            <FormItem>
                <FormLabel>{dict.freeItemForm.freeProduct.label}</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={dict.freeItemForm.freeProduct.placeholder} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {creatorProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name[language]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />


        <Button type="submit" className="w-full">{dict.freeItemForm.submit}</Button>
      </form>
    </Form>
  );
}
