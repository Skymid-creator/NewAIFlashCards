'use client';

import { useState, useEffect, memo } from 'react';
import { useSummary } from '@/context/SummaryContext';
import type { Flashcard as FlashcardType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { RotateCw, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type FlashcardProps = {
  card: FlashcardType;
  onEdit: (id: string, newQuestion: string, newAnswer: string) => void;
  onDelete: (id: string) => void;
  editMode: boolean;
};

// --- (No changes to this button component) ---
const GeminiRememberButton = ({
  onClick,
  disabled,
  isLoading
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
  isLoading: boolean;
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden transition-all duration-300 border-0 shadow-lg text-white",
        "hover:scale-105 hover:shadow-xl",
        isLoading
          ? "bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-red-500 to-blue-500 bg-[length:400%_100%] animate-[gradient_1.5s_linear_infinite]"
          : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
      )}
    >
      <Sparkles className={cn("mr-2 h-4 w-4", isLoading && "animate-pulse")} />
      Remember
    </Button>
  );
};

const Flashcard: React.FC<FlashcardProps> = memo(({ card, onEdit, onDelete, editMode }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const { generateSummary } = useSummary();

  // --- (No changes to hooks or handlers) ---
  useEffect(() => { setIsFlipped(false); }, [card.id, editMode]);
  useEffect(() => { if (question !== card.question) { const handler = setTimeout(() => { onEdit(card.id, question, answer); }, 500); return () => clearTimeout(handler); } }, [question, card.id, card.question, answer, onEdit]);
  useEffect(() => { if (answer !== card.answer) { const handler = setTimeout(() => { onEdit(card.id, question, answer); }, 500); return () => clearTimeout(handler); } }, [answer, card.id, card.answer, question, onEdit]);
  const handleCardClick = (e: React.MouseEvent) => { if (!editMode) { const target = e.target as HTMLElement; if (target.tagName === 'A' || target.closest('button')) { e.stopPropagation(); return; } setIsFlipped(!isFlipped); } };
  const handleFlipButtonClick = (e: React.MouseEvent) => { e.stopPropagation(); setIsFlipped(!isFlipped); };
  const handleRememberClick = async (e: React.MouseEvent) => { e.stopPropagation(); setIsSummaryLoading(true); try { await generateSummary(card.question, card.answer, () => {}, () => setIsSummaryLoading(false)); } catch (error) { console.error('Error generating summary:', error); setIsSummaryLoading(false); } };
  const stopPropagation = (e: React.SyntheticEvent) => { e.stopPropagation(); };
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setQuestion(e.target.value); };
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setAnswer(e.target.value); };

  return (
    <>
      <style jsx>{` @keyframes gradient { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } } `}</style>
      <div
        className={cn( "relative w-full h-full group cursor-pointer", "[perspective:1000px]" )}
        onClick={handleCardClick}
      >
        <div
          className={cn( "relative w-full h-full transition-transform duration-700", "[transform-style:preserve-3d]", isFlipped && "[transform:rotateY(180deg)]" )}
        >
          {/* Card Front */}
          <div className={cn( "absolute w-full h-full", "[backface-visibility:hidden]" )}>
            <Card className="relative w-full h-full min-h-[300px] flex flex-col shadow-md bg-card group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow duration-300">
              {editMode && ( <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="absolute top-2 left-2 z-50"> <X className="h-5 w-5" /> <span className="sr-only">Delete Card</span> </Button> )}
              {/* CHANGE: CardContent is now a standard flex-col */}
              <CardContent className="flex-grow flex flex-col p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Question</h3>
                {/* CHANGE: New wrapper div for perfect centering */}
                <div className="flex-grow flex justify-center items-center w-full">
                  {editMode ? (
                    <Textarea
                      value={question}
                      onChange={handleQuestionChange}
                      onClick={stopPropagation}
                      // CHANGE: Larger, bolder, centered text for edit mode
                      className="w-full h-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-center text-xl md:text-2xl font-semibold leading-relaxed overflow-y-auto"
                      placeholder="Enter your question..."
                    />
                  ) : (
                    // CHANGE: Larger, bolder, centered text for display mode
                    <div className="max-w-none text-center text-xl md:text-2xl font-semibold leading-relaxed whitespace-pre-wrap overflow-y-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{question}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="flex justify-between items-center p-4 border-t">
                {!editMode && ( <GeminiRememberButton onClick={handleRememberClick} disabled={isSummaryLoading} isLoading={isSummaryLoading} /> )}
                <Button variant="ghost" size="icon" onClick={handleFlipButtonClick}> <RotateCw className="h-5 w-5" /> <span className="sr-only">Flip Card</span> </Button>
              </div>
            </Card>
          </div>

          {/* Card Back */}
          <div className={cn( "absolute w-full h-full", "[backface-visibility:hidden]", "[transform:rotateY(180deg)]" )}>
            <Card className="relative w-full h-full min-h-[300px] flex flex-col shadow-md bg-card group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow duration-300">
              {/* CHANGE: CardContent is now a standard flex-col */}
              <CardContent className="flex-grow flex flex-col p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Answer</h3>
                {/* CHANGE: New wrapper div for perfect centering */}
                <div className="flex-grow flex justify-center items-center w-full">
                  {editMode ? (
                    <Textarea
                      value={answer}
                      onChange={handleAnswerChange}
                      onClick={stopPropagation}
                      // CHANGE: Larger, bolder, centered text for edit mode
                      className="w-full h-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-center text-xl md:text-2xl font-semibold leading-relaxed overflow-y-auto"
                      placeholder="Enter your answer..."
                    />
                  ) : (
                     // CHANGE: Larger, bolder, centered text for display mode
                    <div className="max-w-none text-center text-xl md:text-2xl font-semibold leading-relaxed whitespace-pre-wrap overflow-y-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="flex justify-between items-center p-4 border-t">
                 {!editMode && ( <GeminiRememberButton onClick={handleRememberClick} disabled={isSummaryLoading} isLoading={isSummaryLoading} /> )}
                <Button variant="ghost" size="icon" onClick={handleFlipButtonClick}> <RotateCw className="h-5 w-5" /> <span className="sr-only">Flip Card</span> </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
});

Flashcard.displayName = 'Flashcard';

export default Flashcard;