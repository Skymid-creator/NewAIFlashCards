'use client';

import { useState, useEffect, useRef } from 'react';
import { useSummary } from '@/context/SummaryContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Trash2, Undo } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

const UNDO_TIMEOUT = 5000; // 5 seconds

export function SummarySidebar({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
  const { summaries, deleteSummary } = useSummary();
  const prevSummariesLength = useRef(summaries.length);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (summaries.length > prevSummariesLength.current) {
      setTimeout(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [summaries]);

  useEffect(() => {
    const currentLength = summaries.length;
    const prevLength = prevSummariesLength.current;

    if (currentLength > 0 && currentLength > prevLength) {
      onOpenChange(true);
    }
    prevSummariesLength.current = currentLength;
  }, [summaries, onOpenChange]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  // --- MODIFIED LOGIC IS HERE ---
  const handleDelete = (indexToClear: number) => {
    let finalIndex = indexToClear;

    // First, clear any existing timeout to prevent old actions from firing.
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    // If a DIFFERENT item was already pending deletion...
    if (deletingIndex !== null && deletingIndex !== indexToClear) {
      // ...commit the deletion of the PREVIOUS item immediately.
      deleteSummary(deletingIndex);

      // IMPORTANT: If the previously deleted item came BEFORE the one
      // we just clicked, the index of our new item has shifted down by 1.
      // We must adjust the index we're about to set in our state.
      if (deletingIndex < indexToClear) {
        finalIndex--;
      }
    }

    // Now, set the new item as pending deletion using its correct (possibly adjusted) index.
    setDeletingIndex(finalIndex);

    // Set a new timeout to permanently delete this new item after the delay.
    undoTimeoutRef.current = setTimeout(() => {
      // We use finalIndex here as well.
      deleteSummary(finalIndex);
      setDeletingIndex(null); 
      undoTimeoutRef.current = null;
    }, UNDO_TIMEOUT);
  };

  const handleUndo = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setDeletingIndex(null);
    undoTimeoutRef.current = null;
  };


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            <span className={cn({ "animate-gemini": isOpen })}>
              FlashNotes
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 py-4 overflow-hidden">
          {summaries.length > 0 ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {summaries.map((s, index) => (
                  <Card key={index} className="p-4 shadow-md relative transition-all">
                    {deletingIndex === index ? (
                      <div className="flex items-center justify-between h-full">
                        <span className="text-sm text-muted-foreground">Note deleted.</span>
                        <Button variant="ghost" size="sm" onClick={handleUndo}>
                          <Undo className="h-4 w-4 mr-2" />
                          Undo
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(index)}
                          className="absolute top-2 right-2 z-10 opacity-70 hover:opacity-100 rounded-full h-7 w-7"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Note</span>
                        </Button>
                        <CardContent className="p-0 pr-8">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {s}
                          </ReactMarkdown>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
                <div ref={scrollEndRef} />
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No notes generated yet.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}