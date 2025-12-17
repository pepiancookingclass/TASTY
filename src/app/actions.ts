'use server';

import { generateProductDescriptions, GenerateProductDescriptionsInput } from "@/ai/flows/auto-generate-product-descriptions";

export async function generateProductDescriptionsAction(input: GenerateProductDescriptionsInput) {
    try {
        const output = await generateProductDescriptions(input);
        return { data: output };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to generate descriptions. Please try again.' };
    }
}
