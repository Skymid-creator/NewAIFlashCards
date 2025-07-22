'use client';

import type { Flashcard as FlashcardType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

type DiagramFlashcardProps = {
  card: FlashcardType;
};

export default function DiagramFlashcard({ card }: DiagramFlashcardProps) {
  return (
    <Card className="w-full h-full flex flex-col shadow-md bg-card">
      <CardContent className="flex-grow flex flex-col p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Diagram</h3>
        <div className="flex-grow flex justify-center items-center w-full">
          {card.diagram && card.diagram.url ? (
            <img src={card.diagram.url} alt={card.question} className="max-w-full h-auto rounded-lg" />
          ) : (
            <p className="text-muted-foreground">Diagram not available.</p>
          )}
        </div>
        <p className="text-center mt-4 font-semibold">{card.question}</p>
      </CardContent>
    </Card>
  );
}