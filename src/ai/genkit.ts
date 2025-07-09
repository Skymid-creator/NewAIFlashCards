import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

export const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY as string);
