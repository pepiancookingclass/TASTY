'use server';

/**
 * @fileOverview A dietary restriction filter AI agent.
 *
 * - filterByDietaryRestrictions - A function that filters product listings based on dietary restrictions.
 * - FilterByDietaryRestrictionsInput - The input type for the filterByDietaryRestrictions function.
 * - FilterByDietaryRestrictionsOutput - The return type for the filterByDietaryRestrictions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterByDietaryRestrictionsInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the product, including ingredients.'),
});
export type FilterByDietaryRestrictionsInput = z.infer<
  typeof FilterByDietaryRestrictionsInputSchema
>;

const FilterByDietaryRestrictionsOutputSchema = z.object({
  isGlutenFree: z
    .boolean()
    .describe('Whether or not the product is gluten-free.'),
  isVegan: z.boolean().describe('Whether or not the product is vegan.'),
  isDairyFree: z
    .boolean()
    .describe('Whether or not the product is dairy-free.'),
  isNutFree: z.boolean().describe('Whether or not the product is nut-free.'),
});
export type FilterByDietaryRestrictionsOutput = z.infer<
  typeof FilterByDietaryRestrictionsOutputSchema
>;

export async function filterByDietaryRestrictions(
  input: FilterByDietaryRestrictionsInput
): Promise<FilterByDietaryRestrictionsOutput> {
  return filterByDietaryRestrictionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dietaryRestrictionsPrompt',
  input: {schema: FilterByDietaryRestrictionsInputSchema},
  output: {schema: FilterByDietaryRestrictionsOutputSchema},
  prompt: `Analyze the following product description and ingredients to determine if it meets the following dietary restrictions:

- Gluten-free
- Vegan
- Dairy-free
- Nut-free

Description: {{{description}}}

Return a JSON object indicating whether the product meets each restriction (true) or not (false).`,
});

const filterByDietaryRestrictionsFlow = ai.defineFlow(
  {
    name: 'filterByDietaryRestrictionsFlow',
    inputSchema: FilterByDietaryRestrictionsInputSchema,
    outputSchema: FilterByDietaryRestrictionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
