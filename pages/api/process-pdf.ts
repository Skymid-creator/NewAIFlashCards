import type { NextApiRequest, NextApiResponse } from 'next';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        const data = await pdf(buffer);
        res.status(200).json({ text: data.text });
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      res.status(500).json({ error: 'Failed to process PDF' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
