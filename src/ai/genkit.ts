import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

export const geminiFlash = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

export const gemma = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemma-3-27b-it',
});

export const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY as string);
