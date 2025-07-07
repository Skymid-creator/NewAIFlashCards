'use server';

import {
  generateFlashcards,
  type GenerateFlashcardsInput,
} from '@/ai/flows/generate-flashcards';

export async function generateFlashcardsAction(input: GenerateFlashcardsInput) {
  try {
    const { flashcards, rawOutput, logs } = await generateFlashcards(input);

    // The flow now throws on error, so if we get here, the output should be valid.
    if (!flashcards) {
       return { success: false, error: 'AI did not return any flashcards.', logs: logs || [] };
    }
    return { success: true, data: flashcards, rawOutput: rawOutput, logs: logs || [] };
  } catch (error) {
    console.error('Error generating flashcards:', error);
    // Pass the specific error message from the flow to the client.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage, logs: [] };
  }
}
