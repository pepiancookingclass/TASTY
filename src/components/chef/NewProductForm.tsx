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
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  productType: z.enum(['pastry', 'dessert', 'savory', 'cookie']),
  productIngredients: z.string().min(5, { message: "Please list at least one ingredient." }),
  productPrice: z.coerce.number().positive({ message: "Price must be a positive number." }),
  englishDescription: z.string().optional(),
  spanishDescription: z.string().optional(),
});

export function NewProductForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      productType: "pastry",
      productIngredients: "",
    },
  });

  const handleGenerateDescriptions = () => {
    const { productName, productType, productIngredients, productPrice } = form.getValues();
    if (!productName || !productType || !productIngredients || !productPrice) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in Product Name, Type, Ingredients, and Price before generating descriptions.",
      });
      return;
    }
    
    startTransition(async () => {
      const result = await generateProductDescriptionsAction({
        productName,
        productType,
        productIngredients,
        productPrice,
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "AI Generation Failed",
          description: result.error,
        });
      } else if (result.data) {
        form.setValue("englishDescription", result.data.englishDescription);
        form.setValue("spanishDescription", result.data.spanishDescription);
        toast({
          title: "Descriptions Generated!",
          description: "The English and Spanish descriptions have been filled in.",
        });
      }
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Product Submitted!",
      description: "Your new product has been saved (simulation).",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Product Details</CardTitle>
                <CardDescription>Fill in the basic information about your new product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="productName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Flaky Croissant" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="productPrice" render={({ field }) => (
                         <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="e.g., 3.50" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="productType" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Product Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a product type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="pastry">Pastry</SelectItem>
                                <SelectItem value="dessert">Dessert</SelectItem>
                                <SelectItem value="savory">Savory Item</SelectItem>
                                <SelectItem value="cookie">Cookie</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="productIngredients" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ingredients</FormLabel>
                        <FormControl><Textarea placeholder="List ingredients, separated by commas..." {...field} /></FormControl>
                        <FormDescription>This will be used to generate descriptions and dietary flags.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-2xl">Product Descriptions</CardTitle>
                    <Button type="button" variant="outline" onClick={handleGenerateDescriptions} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Generate with AI
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField control={form.control} name="englishDescription" render={({ field }) => (
                    <FormItem>
                        <FormLabel>English Description</FormLabel>
                        <FormControl><Textarea placeholder="A delicious, handcrafted item..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="spanishDescription" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Spanish Description</FormLabel>
                        <FormControl><Textarea placeholder="Un artículo delicioso, hecho a mano..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button type="submit">Create Product</Button>
        </div>
      </form>
    </Form>
  );
}
