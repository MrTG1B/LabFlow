
'use server';
/**
 * @fileOverview An AI-powered item description enhancer.
 * This file defines the server-side logic for the AI enhancement flow.
 *
 * - enhanceDescriptionFlow - The Genkit flow that performs the enhancement.
 * - EnhanceDescriptionInputSchema - The Zod schema for the flow's input.
 * - EnhanceDescriptionOutputSchema - The Zod schema for the flow's output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const EnhanceDescriptionInputSchema = z.object({
  name: z.string().describe('The name of the inventory item.'),
  type: z.string().describe('The type of the inventory item (e.g., Capacitor, Resistor).'),
  value: z.string().describe('The value of the component (e.g., "10k", "1uF").'),
  partNumber: z.string().describe('The manufacturer part number.'),
});
export type EnhanceDescriptionInput = z.infer<typeof EnhanceDescriptionInputSchema>;

export const EnhanceDescriptionOutputSchema = z.object({
  description: z.string().describe('The enhanced, concise description of the item.'),
});
export type EnhanceDescriptionOutput = z.infer<typeof EnhanceDescriptionOutputSchema>;


const prompt = ai.definePrompt({
  name: 'enhanceDescriptionPrompt',
  input: {schema: EnhanceDescriptionInputSchema},
  output: {schema: EnhanceDescriptionOutputSchema},
  prompt: `You are an expert in electronic components. Based on the following details, generate a clear, concise, and helpful description for a lab inventory system. Focus on key specifications and common use cases.

Item Details:
- Name: {{{name}}}
- Type: {{{type}}}
- Value: {{{value}}}
- Part Number: {{{partNumber}}}

Generate a description that is informative but not overly long.`,
});

export const enhanceDescriptionFlow = ai.defineFlow(
  {
    name: 'enhanceDescriptionFlow',
    inputSchema: EnhanceDescriptionInputSchema,
    outputSchema: EnhanceDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
