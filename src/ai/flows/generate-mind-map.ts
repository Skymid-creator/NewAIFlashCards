
'use server';

import { geminiFlash } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMindMapInputSchema = z.object({
  flashcards: z.array(z.object({ id: z.string(), question: z.string(), answer: z.string() })),
});

const GenerateMindMapPromptInputSchema = z.object({
  flashcardsJson: z.string(),
});

const GenerateMindMapOutputSchema = z.string();

export async function generateMindMap(input: z.infer<typeof GenerateMindMapInputSchema>) {
  return generateMindMapFlow(input);
}

const generateMindMapPrompt = geminiFlash.definePrompt({
  name: 'generateMindMapPrompt',
  input: { schema: GenerateMindMapPromptInputSchema },
  prompt: `You are an expert at creating mind maps in Markdown format.
Your task is to analyze the following flashcards and generate a mind map.
The mind map should represent the relationships between the concepts in the flashcards in a clear, hierarchical, and logical manner.

**Instructions for Mind Map Structure:**
1.  **DO NOT LEAVE OUT ANY INFORMATION FROM THE SOURCE.
2.  **Identify a Central Theme:** Determine the overarching topic from the flashcards and make it the central theme (root of the mind map).
3.  **Hierarchical Organization:** Use Markdown headings (#, ##, ###, etc.) to create a hierarchical structure.
4.  **Concise Labels:** Each item in the mind map should be a brief, descriptive phrase or keyword.
5.  **Link to Flashcards:** Each node in the mind map must be a link that contains the flashcard ID. For example: [Flashcard Title](flashcard://<flashcard_id>)

Your response MUST be a valid Markdown object and nothing else.

Flashcards:
{{{flashcardsJson}}}
`,
});

const generateMindMapFlow = geminiFlash.defineFlow(
  {
    name: 'generateMindMapFlow',
    inputSchema: GenerateMindMapInputSchema,
    outputSchema: GenerateMindMapOutputSchema,
  },
  async (input) => {
    const flashcardsJson = JSON.stringify(input.flashcards);
    const { text } = await generateMindMapPrompt({ flashcardsJson });
    return text;
  }
);

