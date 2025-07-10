import { NextApiRequest, NextApiResponse } from 'next';
import { summarizeAndHighlightCard } from '../../src/ai/flows/summarize-and-highlight';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: 'Missing question or answer' });
  }

  try {
    const { result: summary } = await summarizeAndHighlightCard.run({ question, answer });
    res.status(200).json({ summary });
  } catch (error) {
    console.error('Error summarizing flashcard:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}