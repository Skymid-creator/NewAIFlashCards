'use client';

import { useState } from 'react';
import { useSummary } from '@/context/SummaryContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, X, Undo2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


export function SummarySidebar() {
  const { summaries, clearSummaries, deleteSummary } = useSummary();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="fixed top-4 right-4 z-50 px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300">
          <Sparkles className="h-5 w-5 mr-2" /> FlashNotes
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            <span>FlashNotes</span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 py-4">
          {summaries.length > 0 ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {summaries.map((s, index) => (
                  <Card key={index} className="p-4 shadow-md relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSummary(index)}
                      className="absolute top-2 right-2 z-10 opacity-70 hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Delete Note</span>
                    </Button>
                    <CardContent className="p-0 pr-8">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {s}
                      </ReactMarkdown>
                    </CardContent>
                  </Card>
                ))}
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
