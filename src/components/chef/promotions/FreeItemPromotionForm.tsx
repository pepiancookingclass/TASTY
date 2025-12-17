'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { products, sampleChef } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  requiredProductId: z.string({ required_error: "Please select a product to purchase." }),
  freeProductId: z.string({ required_error: "Please select a free product to offer." }),
});

export function FreeItemPromotionForm() {
    const { toast } = useToast();
    const chefProducts = products.filter(p => p.chefId === sampleChef.id);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "Promotion Created!",
            description: "The new 'Buy X, Get Y' promotion has been saved (simulation).",
        });
        form.reset();
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
                <FormLabel>Offer Title</FormLabel>
                <FormControl><Input placeholder="e.g., Croissant Combo Deal" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
                <FormLabel>Short Description</FormLabel>
                <FormControl><Textarea placeholder="e.g., Buy a Quiche, get a free Croissant!" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        
        <FormField control={form.control} name="requiredProductId" render={({ field }) => (
            <FormItem>
                <FormLabel>IF a customer buys...</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {chefProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="freeProductId" render={({ field }) => (
            <FormItem>
                <FormLabel>THEN they get this for free...</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select freebie product" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {chefProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />


        <Button type="submit" className="w-full">Create Free Item Offer</Button>
      </form>
    </Form>
  );
}
