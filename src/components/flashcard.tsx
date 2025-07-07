'use client';

import { useState, useEffect } from 'react';
import type { Flashcard as FlashcardType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { RotateCw } from 'lucide-react';

type FlashcardProps = {
  card: FlashcardType;
  onEdit: (id: string, newQuestion: string, newAnswer: string) => void;
  onDelete: (id: string) => void;
  editMode: boolean;
};

export default function Flashcard({ card, onEdit, onDelete, editMode }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);

  useEffect(() => {
    setIsFlipped(false);
  }, [editMode]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (editMode) return; // Disable flip on click in edit mode
    const target = e.target as HTMLElement;
    // Prevent flipping if a link inside the answer is clicked
    if (target.tagName === 'A' || target.closest('button')) {
        e.stopPropagation();
        return;
    }
    setIsFlipped(!isFlipped);
  };

  const handleFlipButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click handler
    setIsFlipped(!isFlipped);
  }

  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  }

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    onEdit(card.id, e.target.value, answer);
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(e.target.value);
    onEdit(card.id, question, e.target.value);
  };

  return (
    <div className="relative w-full h-full group perspective min-h-[450px]">
      <div
        className={cn("card w-full h-full", isFlipped && 'flipped')}
        onClick={handleCardClick}
      >
        <div className="card-inner relative w-full h-full">
            {/* Card Front (Question) */}
            <div className="card-front absolute w-full h-full">
                <Card className="relative w-full h-full flex flex-col shadow-lg bg-card/95 group-hover:shadow-[0_0_20px_hsl(var(--primary)/.4)] transition-shadow duration-300">
                    <CardContent className="p-8 flex-1 flex flex-col justify-center items-center text-center">
                        <p className="text-sm font-bold text-primary mb-4 tracking-widest">QUESTION</p>
                        {editMode ? (
                          <Textarea
                            value={question}
                            onChange={handleQuestionChange}
                            onClick={stopPropagation}
                            onKeyDown={stopPropagation}
                            className="text-xl md:text-2xl font-semibold text-center resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                          />
                        ) : (
                          <p className="text-xl md:text-2xl font-semibold">{card.question}</p>
                        )}
                    </CardContent>
                    {editMode && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
                            <Button variant="outline" size="icon" onClick={handleFlipButtonClick}>
                                <RotateCw className="h-4 w-4" />
                                <span className="sr-only">Flip Card</span>
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
            {/* Card Back (Answer) */}
            <div className="card-back absolute w-full h-full">
                 <Card className="relative w-full h-full flex flex-col shadow-lg bg-card/95 group-hover:shadow-[0_0_20px_hsl(var(--accent)/.4)] transition-shadow duration-300">
                    <CardContent className="p-8 flex-1 flex flex-col justify-center items-center text-center">
                        <p className="text-sm font-bold text-accent mb-4 tracking-widest">ANSWER</p>
                        {editMode ? (
                          <Textarea
                            value={answer}
                            onChange={handleAnswerChange}
                            onClick={stopPropagation}
                            onKeyDown={stopPropagation}
                            className="text-lg md:text-xl font-medium text-center resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                          />
                        ) : (
                          <div className="text-lg md:text-xl font-medium whitespace-pre-wrap prose prose-invert prose-p:my-2 prose-strong:text-foreground">{card.answer}</div>
                        )}
                    </CardContent>
                    {editMode && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
                            <Button variant="outline" size="icon" onClick={handleFlipButtonClick}>
                                <RotateCw className="h-4 w-4" />
                                <span className="sr-only">Flip Card</span>
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}