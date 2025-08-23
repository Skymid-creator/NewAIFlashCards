'use server';

import {
  generateFlashcards,
} from '@/ai/flows/generate-flashcards';
import { fileManager } from '@/ai/genkit';
import {promises as fs} from 'fs';
import path from 'path';
import os from 'os';

export async function generateFlashcardsAction(formData: FormData) {
  try {
    const text = formData.get('text') as string;
    const files = formData.getAll('files') as File[];

    const fileParts: ({ url: string, contentType: string } | { text: string })[] = await Promise.all(files.map(async (file) => {
      if (file.type.startsWith('image/')) {
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, file.name);
        await fs.mkdir(tempDir, { recursive: true }); // Ensure directory exists
        await fs.writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: file.type,
          displayName: file.name,
        });
        await fs.unlink(tempFilePath);
        return { url: uploadResult.file.uri, contentType: file.type };
      }
      // If the file type is not an image, return an object that doesn't match the expected types
      // This case should ideally be handled by frontend filtering.
      return { url: '', contentType: '' }; // Fallback for unexpected file types
    }));

    const { flashcards, rawOutput, logs } = await generateFlashcards({
      text,
      images: fileParts.filter((part): part is { url: string, contentType: string } => 'url' in part && part.url !== ''),
      pdfText: '',
    });

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
