
import { gemma } from '../../ai/genkit';
import { z } from 'zod';

export const summarizeAndHighlightCard = gemma.defineFlow(
  {
    name: 'summarizeAndHighlightCard',
    inputSchema: z.object({
      question: z.string(),
      answer: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ question, answer }) => {
    const prompt = `You are an expert in creating highly concise and effective study notes.
      A user has a flashcard with the following question and answer:
      Question: ${question}
      Answer: ${answer}

      Your task is to generate a summary that is extremely straight to the point, capturing only the essential information from the flashcard.
      Ensure no crucial information is lost, but eliminate any redundancy.
      Highlight the most important keywords, values, and key terms using Markdown (e.g., bolding, italics, lists).
      The note should be a highly summarized version that helps the user quickly recall the core information.
      IMPORTANT: Only provide the summarized note. Do not include any other text, introductions, or conclusions.`;

    const result = await gemma.generate({
      prompt,
      config: {
        temperature: 0.3, // Lower temperature for more focused output
      },
    });

    console.log('Gemma generate result:', result);
    return result.custom.text();
  }
);