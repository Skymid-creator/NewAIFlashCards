'use client';

import { v4 as uuidv4 } from 'uuid';

import { useState, useTransition, useRef, useEffect } from 'react';
import { BrainCircuit, Loader, Plus, Sparkles, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateFlashcardsAction } from './actions';
import type { Flashcard as FlashcardType } from '@/types';
import FlashcardCarousel from '@/components/flashcard-carousel';
import CardListSidebar from '@/components/card-list-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import type { CarouselApi } from '@/components/ui/carousel';

type DeletedFlashcard = {
    card: FlashcardType;
    index: number;
}

function AddCardPointer({ isActive }: { isActive: boolean }) {
    const [position, setPosition] = useState({ x: -1000, y: -1000 });

    useEffect(() => {
        if (!isActive) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div 
            className="fixed top-0 left-0 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-[100] transition-transform duration-75 ease-out"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        >
            <div className="w-48 h-32 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center p-4 border border-primary/30">
                <Plus className="h-8 w-8 text-primary/80" />
            </div>
        </div>
    )
}

export default function Home() {
  const [text, setText] = useState('');
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [rawOutput, setRawOutput] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentCardIndexToScrollTo, setCurrentCardIndexToScrollTo] = useState<number | null>(null);
  const [deletedFlashcards, setDeletedFlashcards] = useState<DeletedFlashcard[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [progressLogs, setProgressLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!editMode) {
        setIsAdding(false);
    }
  }, [editMode]);

  const handleExport = () => {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'flashcards.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Flashcards Exported",
      description: "Your flashcards have been successfully exported.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let allImportedFlashcards: FlashcardType[] = [];
    let successfulImports = 0;
    let failedImports = 0;

    const processFile = (index: number) => {
      if (index >= files.length) {
        if (successfulImports > 0) {
          setFlashcards(prev => [...prev, ...allImportedFlashcards]);
          setDeletedFlashcards([]); // Clear deleted cards on import
          toast({
            title: "Flashcards Imported",
            description: `Successfully imported ${successfulImports} file(s). ${failedImports > 0 ? `Failed to import ${failedImports} file(s).` : ''}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: "No valid flashcards were found in the selected files.",
          });
        }
        return;
      }

      const file = files[index];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedData) && importedData.every(card => card.question && card.answer)) {
            const flashcardsWithIds = importedData.map(card => ({
              ...card,
              id: uuidv4(),
            }));
            allImportedFlashcards = [...allImportedFlashcards, ...flashcardsWithIds];
            successfulImports++;
          } else {
            failedImports++;
            toast({
              variant: "destructive",
              title: "Import Failed",
              description: `File '${file.name}': Invalid format. Please ensure it's a valid flashcards JSON file.`,
            });
          }
        } catch (error) {
          failedImports++;
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: `File '${file.name}': Error parsing file. Please ensure it's a valid JSON.`,
          });
        }
        processFile(index + 1);
      };
      reader.readAsText(file);
    };

    processFile(0);
  };

  const handleGenerate = () => {
    if (text.trim().length < 20) {
        toast({
            variant: "destructive",
            title: "Text is too short",
            description: "Please provide more text to generate flashcards.",
        });
        return;
    }
    setProgressLogs([]); // Clear previous logs
    startTransition(async () => {
      const result = await generateFlashcardsAction({ text });
      setProgressLogs(result.logs || []);
      if (result.success && result.data) {
        const flashcardsWithIds = (result.data as Omit<FlashcardType, 'id'>[]).map(card => ({
            ...card,
            id: uuidv4(),
        }));

        if (flashcardsWithIds.length === 0) {
            toast({
                variant: "destructive",
                title: "Generation Failed",
                description: "Could not generate any flashcards from the text. Please try again.",
            });
        }
        setFlashcards(flashcardsWithIds);
        setRawOutput(result.rawOutput || '');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
    });
  };

  const handleEdit = (id: string, newQuestion: string, newAnswer: string) => {
    setFlashcards(prev =>
      prev.map(card =>
        card.id === id
          ? { ...card, question: newQuestion, answer: newAnswer }
          : card
      )
    );
  };

  const handleDelete = (id: string) => {
    setFlashcards(prev => {
      const cardIndex = prev.findIndex(card => card.id === id);
      if (cardIndex !== -1) {
        const deletedCard = prev[cardIndex];
        setDeletedFlashcards(prevDeleted => {
          // Filter out any existing entries for this card ID
          const filteredDeleted = prevDeleted.filter(item => item.card.id !== id);
          return [...filteredDeleted, { card: deletedCard, index: cardIndex }];
        });
      }
      return prev.filter(card => card.id !== id);
    });
  };

  const handleUndo = () => {
    if (deletedFlashcards.length === 0) return;

    const lastDeleted = deletedFlashcards[deletedFlashcards.length - 1];
    setDeletedFlashcards(prev => prev.slice(0, -1));

    setFlashcards(prev => {
        const newFlashcards = [...prev];
        newFlashcards.splice(lastDeleted.index, 0, lastDeleted.card);
        return newFlashcards;
    });
  };

  const handleStartOver = () => {
    setFlashcards([]);
    setText('');
  };

  const handleAddCard = (index: number) => {
    const newCard: FlashcardType = {
        id: uuidv4(),
        question: 'New Question',
        answer: 'New Answer',
    };
    setFlashcards(prev => {
        const newFlashcards = [...prev];
        newFlashcards.splice(index, 0, newCard);
        return newFlashcards;
    });
    setIsAdding(false);
  }

  const handleReorderCards = (oldIndex: number, newIndex: number) => {
    setFlashcards(prev => {
        const newFlashcards = [...prev];
        const [removed] = newFlashcards.splice(oldIndex, 1);
        newFlashcards.splice(newIndex, 0, removed);
        return newFlashcards;
    });
  }

  const handleNavigate = (id: string) => {
    const index = flashcards.findIndex(c => c.id === id);
    if (index !== -1) {
        setCurrentCardIndexToScrollTo(index);
        setIsSidebarOpen(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/.1),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/.1),transparent_30%)]"></div>
      <AddCardPointer isActive={isAdding} />

      {flashcards.length === 0 && !isPending ? (
        <div className="w-full max-w-2xl text-center flex flex-col items-center animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4 text-primary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <BrainCircuit size={48} strokeWidth={1.5} className="text-accent" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary from-40% to-accent">Skymid Flashcards</h1>
            </div>
          <p className="text-muted-foreground mb-8 max-w-md animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Instantly transform your notes, articles, or any text into a set of interactive flashcards using the power of AI.
          </p>
          <div className="w-full space-y-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="min-h-[200px] bg-card/80 backdrop-blur-sm text-base"
              rows={10}
            />
            <div className="flex gap-2">
              <Button onClick={handleGenerate} size="lg" className="w-full">
                <Sparkles className="mr-2 text-accent" />
                Generate Flashcards
              </Button>
              <Button onClick={handleImportClick} size="lg" variant="outline">
                Import
              </Button>
            </div>
          </div>
        </div>
      ) : isPending ? (
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping"></div>
            <BrainCircuit className="relative text-primary animate-pulse" size={48} />
          </div>
          <h2 className="text-2xl font-semibold">Generating your flashcards...</h2>
          <p className="text-muted-foreground">This may take a few moments. Please wait.</p>
          {progressLogs.length > 0 && (
            <div className="w-full max-w-md mt-4 p-4 bg-card/80 backdrop-blur-sm rounded-lg shadow-inner text-left text-sm text-muted-foreground">
              <h3 className="font-semibold mb-2">Progress:</h3>
              <ul className="list-disc list-inside space-y-1">
                {progressLogs.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col animate-fade-in">
          <header className="flex justify-between items-center mb-4 md:mb-6">
            <div className="flex items-center gap-3 text-primary">
                <BrainCircuit size={32} strokeWidth={1.5} className="text-accent" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary from-40% to-accent">Skymid Flashcards</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsSidebarOpen(true)} variant="outline">
                <PanelRight className="mr-2" />
                View Cards
              </Button>
              {editMode && (
                <Button onClick={() => setIsAdding(!isAdding)} variant="outline">
                    <Plus className="mr-2" />
                    {isAdding ? 'Cancel' : 'Add Flashcard'}
                </Button>
              )}
              {deletedFlashcards.length > 0 && (
                <Button onClick={handleUndo} variant="outline">
                  Undo
                </Button>
              )}
              <Button onClick={handleExport} variant="outline">
                Export
              </Button>
              <Button onClick={handleImportClick} variant="outline">
                Import
              </Button>
              <Button onClick={() => setEditMode(!editMode)} variant="outline">
                {editMode ? 'Done' : 'Edit'}
              </Button>
              <Button onClick={handleStartOver} variant="outline">
                <Plus className="mr-2 -rotate-45" />
                New Set
              </Button>
            </div>
          </header>
          <FlashcardCarousel
            cards={flashcards}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddCard={handleAddCard}
            editMode={editMode}
            isAddingCard={isAdding}
            scrollToIndex={currentCardIndexToScrollTo}
          />
          {rawOutput && (
            <div className="mt-8 w-full">
              <h2 className="text-xl font-semibold mb-2">Raw AI Output</h2>
              <Textarea
                value={rawOutput}
                readOnly
                className="min-h-[200px] bg-card/80 backdrop-blur-sm text-base font-mono"
                rows={10}
              />
            </div>
          )}
        </div>
      )}
      <CardListSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        cards={flashcards}
        onReorder={handleReorderCards}
        onDelete={handleDelete}
        onAdd={handleAddCard}
        onNavigate={handleNavigate}
      />
    <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        multiple
        className="hidden"
      />
    </main>
  );
}
