'use server'

/**
 * @fileOverview Generates flashcards from input text using the Gemini API.
 *
 * - generateFlashcards - A function that generates flashcards from the input text.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {geminiFlash} from '@/ai/genkit';
import {z} from 'genkit';
import {defineSchema} from 'genkit';


const GenerateFlashcardsInputSchema = z.object({
  text: z.string().describe('The text to generate flashcards from.'),
  images: z.array(z.object({ url: z.string(), contentType: z.string() })).optional().describe('An array of Gemini File API URIs with content types.'),
  pdfText: z.string().optional().describe('Text extracted from PDF files.'),
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

const generateFlashcardsPrompt = geminiFlash.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  prompt: `You are an expert at creating flashcards. Your task is to analyze the following text and images (if provided) and generate a list of questions and answers based on them.
  Follow these rules strictly:
  Generate atomic flashcards — each flashcard should test only one fact or concept.
  Do not leave out any information from the source [VERY IMPORTANT].
  Include all content accurately and completely.
  The goal is to enable the user to fully master the material and be able to reconstruct the original source from the flashcards.

Your response MUST be a valid JSON object and nothing else.
- The root of the object must be a single key named "flashcards".
- The value of "flashcards" must be an array of objects.
- Each object in the array must have a "question" key and an "answer" key.

**How to Process Input:**

1.  **Formatted Text:** If the text contains sections that start with "Question:" on one line and "Answer:" on a following line, you MUST parse these and use the exact content for the flashcards.

2.  **Unformatted Text:** For any other text, generate meaningful question-and-answer pairs.

3.  **Images:** If images are provided, they are references to files in the Gemini Files API. Perform OCR on the images to extract any text. Analyze the extracted text and the image content to generate relevant question-and-answer pairs. For example, if an image contains a diagram, ask questions about the components of the diagram. If an image contains text, treat that text as part of the input.

4.  **Mixed Content:** The input may contain both formatted and unformatted text, as well as images. You must handle all cases and combine all resulting flashcards into a single array.

5.  **Tables from Images:** If an image contains a table, extract the data and represent it accurately in markdown table format within the flashcard's "answer" field. Preserve the original structure and content of the table as closely as possible.

6.  **Implicit Tables:** If the input text or extracted image text contains structured data that naturally lends itself to a tabular representation (e.g., lists of items with properties, comparisons, structured data), create a markdown table in the flashcard's "answer" field, even if the original source did not explicitly provide a table. Ensure the table is clear, concise, and enhances understanding.

7. **Unwanted text:** If the input contain unwanted text which cannot be made into flashcards, ignore them

8. **Response Size:** Be mindful of the total response size. If a markdown table or a long answer is causing the response to be too large, either summarize the information or split it into multiple, smaller flashcards to avoid truncation.

**Important Rules:**
- Your output must ONLY be the JSON object. Do not add any introductory text like "Here are the flashcards...".
- If you cannot create any meaningful flashcards from the text or images, return an empty "flashcards" array.

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

{{#if pdfText}}
Text from PDF:
{{{pdfText}}}
{{/if}}

{{#if images}}
Input Images:
{{#each images}}
  {{media url=this.url contentType=this.contentType}}
{{/each}}
{{/if}}
`,
});

const generateFlashcardsFlow = geminiFlash.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
  },
  async (input) => {
    const logs: string[] = [];
    const log = (message: string) => {
      logs.push(message);
    };

    log('Sending text and images to AI...');
    const { text } = await generateFlashcardsPrompt(input);
    log('Received response from AI. Parsing...');

    let rawText = text;
    console.log('Raw AI output:', rawText); // Log raw output for debugging

    // Strip markdown code block fences
    if (rawText.startsWith('```json')) {
      rawText = rawText.substring(7);
    }
    if (rawText.endsWith('```')) {
      rawText = rawText.slice(0, -3);
    }
    rawText = rawText.trim();

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
      // If parsing fails, try to repair the JSON string
      log('Failed to parse JSON, attempting to repair...');
      const repairedJsonString = jsonString.replace(/,s*]/g, ']').replace(/,s*}/g, '}');
      try {
        parsedOutput = JSON.parse(repairedJsonString);
        log('Successfully parsed repaired JSON.');
      } catch (e2: any) {
        throw new Error(`Failed to parse AI response as JSON, even after repair: ${e2.message}. Attempted to parse: ${repairedJsonString}`);
      }
    }

    if (!parsedOutput || !Array.isArray(parsedOutput.flashcards) || parsedOutput.flashcards.length === 0) {
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