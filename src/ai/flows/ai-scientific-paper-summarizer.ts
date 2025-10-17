
'use server';
/**
 * @fileOverview An AI-powered scientific paper summarizer.
 * This file defines the server-side logic for the AI summarization flow.
 *
 * - summarizePaperFlow - The Genkit flow that performs the summarization.
 * - SummarizePaperInput - The Zod schema for the flow's input.
 * - SummarizePaperOutput - The Zod schema for the flow's output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePaperInputSchema = z.object({
  paperText: z
    .string()
    .describe('The text of the scientific paper to summarize.'),
});
export type SummarizePaperInput = z.infer<typeof SummarizePaperInputSchema>;

const SummarizePaperOutputSchema = z.object({
  summary: z.string().describe('The summary of the scientific paper.'),
});
export type SummarizePaperOutput = z.infer<typeof SummarizePaperOutputSchema>;


const prompt = ai.definePrompt({
  name: 'summarizePaperPrompt',
  input: {schema: SummarizePaperInputSchema},
  output: {schema: SummarizePaperOutputSchema},
  prompt: `You are an expert scientific summarizer.  Please summarize the following paper in a clear and concise manner.\n\nPaper Text: {{{paperText}}}`,
});

export const summarizePaperFlow = ai.defineFlow(
  {
    name: 'summarizePaperFlow',
    inputSchema: SummarizePaperInputSchema,
    outputSchema: SummarizePaperOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
