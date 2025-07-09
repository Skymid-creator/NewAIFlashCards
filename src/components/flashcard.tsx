'use client';

import { useState, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Flashcard as FlashcardType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { RotateCw, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type FlashcardProps = {
  card: FlashcardType;
  onEdit: (id: string, newQuestion: string, newAnswer: string) => void;
  onDelete: (id: string) => void;
  editMode: boolean;
};

export default memo(function Flashcard({ card, onEdit, onDelete, editMode }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);

  useEffect(() => {
    setIsFlipped(false);
  }, [editMode]);

  useEffect(() => {
    if (question !== card.question) {
      const handler = setTimeout(() => {
        onEdit(card.id, question, answer);
      }, 500); // Debounce for 500ms
      return () => {
        clearTimeout(handler);
      };
    }
  }, [question, card.id, card.question, answer, onEdit]);

  useEffect(() => {
    if (answer !== card.answer) {
      const handler = setTimeout(() => {
        onEdit(card.id, question, answer);
      }, 500); // Debounce for 500ms
      return () => {
        clearTimeout(handler);
      };
    }
  }, [answer, card.id, card.answer, question, onEdit]);

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
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(e.target.value);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={card.id} // Key is crucial for AnimatePresence to track items
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        className="relative w-full h-full group perspective min-h-[450px]"
      >
      <div
        className={cn("card w-full h-full", isFlipped && 'flipped')}
        onClick={handleCardClick}
      >
        <div className="card-inner relative w-full h-full">
            {/* Card Front (Question) */}
            <div className="card-front absolute w-full h-full">
                <Card className="relative w-full h-full flex flex-col shadow-lg bg-card group-hover:shadow-[0_0_20px_hsl(var(--primary)/.4)] transition-shadow duration-300">
                    {editMode && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="absolute top-2 right-2 z-50">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Delete Card</span>
                        </Button>
                    )}
                    <CardContent className="p-8 flex-1 flex flex-col justify-center items-center text-center transition-all duration-300">
                        <p className="text-sm font-bold text-primary mb-4 tracking-widest">QUESTION</p>
                        {editMode ? (
                          <Textarea
                            value={question}
                            onChange={handleQuestionChange}
                            onClick={stopPropagation}
                            onKeyDown={stopPropagation}
                            className="text-xl md:text-2xl font-semibold text-center resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent transition-all duration-300"
                          />
                        ) : (
                          <p className="text-xl md:text-2xl font-semibold transition-all duration-300">{card.question}</p>
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
                 <Card className="relative w-full h-full flex flex-col shadow-lg bg-card group-hover:shadow-[0_0_20px_hsl(var(--accent)/.4)] transition-shadow duration-300">
                    {editMode && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="absolute top-2 right-2 z-50">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Delete Card</span>
                        </Button>
                    )}
                    <CardContent className="p-8 flex-1 flex flex-col justify-center items-center text-center transition-all duration-300">
                        <p className="text-sm font-bold text-accent mb-4 tracking-widest">ANSWER</p>
                        {editMode ? (
                          <Textarea
                            value={answer}
                            onChange={handleAnswerChange}
                            onClick={stopPropagation}
                            onKeyDown={stopPropagation}
                            className="text-lg md:text-xl font-medium text-center resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent transition-all duration-300"
                          />
                        ) : (
                          <div className="text-lg md:text-xl font-medium whitespace-pre-wrap prose prose-invert prose-p:my-2 prose-strong:text-foreground transition-all duration-300">
                            <div>
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                              >{card.answer}</ReactMarkdown>
                            </div>
                          </div>
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
    </motion.div>
    </AnimatePresence>
  );
});