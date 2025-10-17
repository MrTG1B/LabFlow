
"use server";

import { enhanceDescriptionFlow, type EnhanceDescriptionInput } from "@/ai/flows/enhance-item-description";

export async function enhanceDescription(input: EnhanceDescriptionInput) {
  try {
    const { description } = await enhanceDescriptionFlow(input);
    return { success: true, description };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
