'use server';
/**
 * @fileOverview An AI agent to automatically generate product descriptions in both English and Spanish.
 *
 * - generateProductDescriptions - A function that handles the product description generation.
 * - GenerateProductDescriptionsInput - The input type for the generateProductDescriptions function.
 * - GenerateProductDescriptionsOutput - The return type for the generateProductDescriptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productType: z.string().describe('The type of the product (e.g., pastry, dessert, savory item).'),
  productIngredients: z.string().describe('A list of the product ingredients.'),
  productPrice: z.number().describe('The price of the product.'),
});
export type GenerateProductDescriptionsInput = z.infer<typeof GenerateProductDescriptionsInputSchema>;

const GenerateProductDescriptionsOutputSchema = z.object({
  englishDescription: z.string().describe('The generated product description in English.'),
  spanishDescription: z.string().describe('The generated product description in Spanish.'),
});
export type GenerateProductDescriptionsOutput = z.infer<typeof GenerateProductDescriptionsOutputSchema>;

export async function generateProductDescriptions(
  input: GenerateProductDescriptionsInput
): Promise<GenerateProductDescriptionsOutput> {
  return generateProductDescriptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionsPrompt',
  input: {schema: GenerateProductDescriptionsInputSchema},
  output: {schema: GenerateProductDescriptionsOutputSchema},
  prompt: `You are a marketing expert specializing in food products. Generate a product description in both English and Spanish based on the following information:

Product Name: {{{productName}}}
Product Type: {{{productType}}}
Ingredients: {{{productIngredients}}}
Price: {{{productPrice}}}

English Description:
Spanish Description:`, 
});

const generateProductDescriptionsFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionsFlow',
    inputSchema: GenerateProductDescriptionsInputSchema,
    outputSchema: GenerateProductDescriptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
