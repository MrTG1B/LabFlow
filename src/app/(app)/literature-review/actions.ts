"use server";

import { summarizePaper, SummarizePaperInput } from "@/ai/flows/ai-scientific-paper-summarizer";

export async function getSummary(input: SummarizePaperInput) {
  try {
    const { summary } = await summarizePaper(input);
    return { success: true, summary };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
