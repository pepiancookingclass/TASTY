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

const formSchema = z.object({
  productId: z.string({ required_error: "Please select a product." }),
  discountPercentage: z.coerce.number().min(1, "Discount must be at least 1%.").max(100, "Discount cannot exceed 100%."),
});

export function DiscountPromotionForm() {
    const { toast } = useToast();
    // In a real app, we'd get the current chef's ID
    const chefProducts = products.filter(p => p.chefId === sampleChef.id);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });


    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        const selectedProduct = products.find(p => p.id === values.productId);
        toast({
            title: "Discount Created!",
            description: `A ${values.discountPercentage}% discount for ${selectedProduct?.name} has been saved (simulation).`,
        });
        form.reset();
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
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
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
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
