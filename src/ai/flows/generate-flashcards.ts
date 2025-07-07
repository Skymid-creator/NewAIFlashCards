'use server'

/**
 * @fileOverview Generates flashcards from input text using the Gemini API.
 *
 * - generateFlashcards - A function that generates flashcards from the input text.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  text: z.string().describe('The text to generate flashcards from.'),
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
  question: z.string().describe('The question for the flashcard.'),
  answer: z.string().describe('The answer for the flashcard.'),
});

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
  rawOutput: z.string().describe('The raw JSON output from the AI model.'),
});

export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput & { logs: string[] }> {
  return generateFlashcardsFlow(input);
}

const generateFlashcardsPrompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  prompt: `You are an expert at creating flashcards. Your task is to analyze the following text and generate a list of questions and answers based on it.
  Follow these rules strictly:
  Generate atomic flashcards — each flashcard should test only one fact or concept.
  Do not leave out any information from the source. 
  Include all content accurately and completely.
  The goal is to enable the user to fully master the material and be able to reconstruct the original source from the flashcards.

Your response MUST be a valid JSON object and nothing else.
- The root of the object must be a single key named "flashcards".
- The value of "flashcards" must be an array of objects.
- Each object in the array must have a "question" key and an "answer" key.

**How to Process Input:**

1.  **Formatted Text:** If the text contains sections that start with "Question:" on one line and "Answer:" on a following line, you MUST parse these and use the exact content for the flashcards.

2.  **Unformatted Text:** For any other text, generate meaningful question-and-answer pairs.

3.  **Mixed Content:** The input may contain both formatted and unformatted text. You must handle both cases and combine all resulting flashcards into a single array.

4. **Unwanted text:** If the input contain unwanted text which cannot be made into flashcards, ignore them

**Important Rules:**
- Your output must ONLY be the JSON object. Do not add any introductory text like "Here are the flashcards...".
- If you cannot create any meaningful flashcards from the text, return an empty "flashcards" array.

Example of a valid response:
{
  "flashcards": [
    {
      "question": "What is the capital of France?",
      "answer": "Paris."
    }
  ]
}

Input Text:
{{{text}}}
`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
  },
  async (input) => {
    const logs: string[] = [];
    const log = (message: string) => {
      logs.push(message);
    };

    log('Sending text to AI...');
    const { text } = await generateFlashcardsPrompt(input);
    log('Received response from AI. Parsing...');

    let rawText = text;
    console.log('Raw AI output:', rawText); // Log raw output for debugging

    // Robustly extract JSON by finding the first { and last }
    const jsonStartIndex = rawText.indexOf('{');
    const jsonEndIndex = rawText.lastIndexOf('}');

    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error(`Failed to find valid JSON in AI response. Raw output: ${rawText}`);
    }

    const jsonString = rawText.substring(jsonStartIndex, jsonEndIndex + 1);

    let parsedOutput: Omit<GenerateFlashcardsOutput, 'rawOutput'>;
    try {
      parsedOutput = JSON.parse(jsonString);
      log('AI response parsed successfully.');
    } catch (e) {
      throw new Error(`Failed to parse AI response as JSON: ${e.message}. Attempted to parse: ${jsonString}`);
    }

    if (!parsedOutput || !Array.isArray(parsedOutput.flashcards)) {
      throw new Error("The AI model returned a malformed or empty response. Please try again.");
    }

    log('Filtering incomplete flashcards...');
    // Filter out any flashcards that are missing a question or an answer
    parsedOutput.flashcards = parsedOutput.flashcards.filter(flashcard => flashcard.question && flashcard.answer);
    log(`Generated ${parsedOutput.flashcards.length} flashcards.`);

    const finalOutput: GenerateFlashcardsOutput = {
      ...parsedOutput,
      rawOutput: rawText,
    };

    // Manually validate the filtered output against the schema
    const validationResult = GenerateFlashcardsOutputSchema.safeParse(finalOutput);
    if (!validationResult.success) {
      throw new Error(`Schema validation failed after filtering: ${validationResult.error.message}. Processed output: ${JSON.stringify(finalOutput)}`);
    }
    
    log('Flashcard generation complete!');
    return { ...validationResult.data, logs };
  }
);