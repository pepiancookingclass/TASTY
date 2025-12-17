'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  offerType: z.enum(['discount', 'free_item']),
  discountPercentage: z.coerce.number().optional(),
  freeItemId: z.string().optional(),
}).refine(data => {
    if (data.offerType === 'discount') return data.discountPercentage && data.discountPercentage > 0;
    if (data.offerType === 'free_item') return !!data.freeItemId;
    return false;
}, {
    message: "Please provide a valid value for the selected offer type.",
    path: ['discountPercentage'], // or freeItemId, depending on the error message strategy
});

export function PromotionForm() {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            offerType: "discount",
        },
    });

    const offerType = form.watch('offerType');

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "Promotion Created!",
            description: "The new promotion has been saved (simulation).",
        });
        form.reset();
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="e.g., Weekend Special" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="e.g., Get 15% off all pastries!" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="offerType" render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Offer Type</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="discount" /></FormControl>
                    <FormLabel className="font-normal">Discount</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="free_item" /></FormControl>
                    <FormLabel className="font-normal">Free Item</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
        )} />
        
        {offerType === 'discount' && (
            <FormField control={form.control} name="discountPercentage" render={({ field }) => (
                <FormItem>
                    <FormLabel>Discount Percentage</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 15" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        )}

        {offerType === 'free_item' && (
            <FormField control={form.control} name="freeItemId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Free Item</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a product to give away" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
        )}

        <Button type="submit" className="w-full">Create Promotion</Button>
      </form>
    </Form>
  );
}
