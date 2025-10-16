'use server';
/**
 * @fileOverview An AI-powered scientific paper summarizer.
 *
 * - summarizePaper - A function that summarizes a scientific paper.
 * - SummarizePaperInput - The input type for the summarizePaper function.
 * - SummarizePaperOutput - The return type for the summarizePaper function.
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

export async function summarizePaper(input: SummarizePaperInput): Promise<SummarizePaperOutput> {
  return summarizePaperFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePaperPrompt',
  input: {schema: SummarizePaperInputSchema},
  output: {schema: SummarizePaperOutputSchema},
  prompt: `You are an expert scientific summarizer.  Please summarize the following paper in a clear and concise manner.\n\nPaper Text: {{{paperText}}}`,
});

const summarizePaperFlow = ai.defineFlow(
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
