'use client';

import * as React from 'react';
import { memo } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import Flashcard from './flashcard';
import type { Flashcard as FlashcardType } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';



function AddCardDropZone({ onClick, isAdding }: { onClick: () => void; isAdding: boolean }) {
    const [isOver, setIsOver] = React.useState(false);
  
    return (
      <div 
        className={cn(
          "relative w-12 h-full flex items-center justify-center cursor-pointer transition-all duration-300",
          !isAdding && "opacity-0 pointer-events-none"
        )}
        onClick={(e) => {
            e.stopPropagation();
            if (isAdding) onClick();
        }}
        onMouseEnter={() => setIsOver(true)}
        onMouseLeave={() => setIsOver(false)}
      >
        <div className={cn(
            "w-1 h-64 bg-primary/20 rounded-full transition-all duration-300",
            isOver && "h-72 w-2 bg-primary/40"
        )}></div>
      </div>
    );
}

const SortableFlashcard = memo(function SortableFlashcard({ card, onEdit, onDelete, editMode }: { card: FlashcardType; onEdit: FlashcardCarouselProps['onEdit']; onDelete: FlashcardCarouselProps['onDelete']; editMode: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.3s ease-out, opacity 0.2s ease-out',
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...(editMode ? { ...attributes, ...listeners } : {})} className="h-full animate-fade-in-up">
      <Flashcard
        card={card}
        onEdit={onEdit}
        onDelete={onDelete}
        editMode={editMode}
      />
    </div>
  );
});

type FlashcardCarouselProps = {
  cards: FlashcardType[];
  onEdit: (id: string, newQuestion: string, newAnswer:string) => void;
  onDelete: (id: string) => void;
  onAddCard: (index: number) => void;
  editMode: boolean;
  isAddingCard: boolean;
  scrollToIndex: number | null;
  onCardSelect: (index: number) => void;
};

export default function FlashcardCarousel({ cards, onEdit, onDelete, onAddCard, editMode, isAddingCard, scrollToIndex, onCardSelect }: FlashcardCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (api && scrollToIndex !== null) {
      api.scrollTo(scrollToIndex);
    }
  }, [api, scrollToIndex]);

  const handleApiInit = (api: CarouselApi) => {
    if (!api) return;
    setApi(api);

    setTotal(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
      onCardSelect(api.selectedScrollSnap());
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      // Disable keyboard sensor when in edit mode to allow textarea to handle arrow keys
      // This assumes that when editMode is true, a textarea is focused and needs keyboard input.
      // Further refinement might be needed if other elements in edit mode also need keyboard navigation.
      disabled: editMode,
      onActivation: ({ event }) => {
        // If in edit mode and the event target is a textarea, prevent activation
        if (editMode && (event.target as HTMLElement).tagName === 'TEXTAREA') {
          return false; // Prevent activation
        }
        return true; // Allow activation otherwise
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!editMode) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!activeId) return;

    setActiveId(null);
  };

  const activeCard = activeId ? cards.find(card => card.id === activeId) : null;
  
  if (cards.length === 0 && !editMode) {
    return (
      <div className="flex flex-1 items-center justify-center animate-fade-in">
        <Card className="w-full max-w-md text-center bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold">All done!</h3>
            <p className="text-muted-foreground mt-2">You've cleared all the flashcards in this set.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full relative">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={cards.map(card => card.id)}>
          <Carousel 
              setApi={handleApiInit} 
              className="w-full flex-1 max-w-full transition-all duration-500 px-4 md:px-12"
              opts={{
                  align: 'center',
                  loop: false,
              }}
              editMode={editMode}
          >
              <CarouselContent className="-ml-8">
                {editMode && (
                    <CarouselItem className="pl-8 basis-auto">
                        <AddCardDropZone onClick={() => onAddCard(0)} isAdding={isAddingCard} />
                    </CarouselItem>
                )}
              {cards.map((card, index) => (
                  <CarouselItem 
                      key={card.id} 
                      className={cn(
                          "pl-8 transition-all duration-500",
                          "basis-full md:basis-4/5 lg:basis-3/4 min-h-[400px]",
                          !editMode && (api && api.selectedScrollSnap() !== index ? "opacity-30 scale-90 blur-sm" : "opacity-100 scale-100 blur-0")
                      )}
                  >
                    <div className="flex h-full items-center">
                        <div className="p-1 h-full flex-1">
                            <SortableFlashcard
                                card={card}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                editMode={editMode}
                            />
                        </div>
                        {editMode && (
                            <AddCardDropZone onClick={() => onAddCard(index + 1)} isAdding={isAddingCard} />
                        )}
                    </div>
                  </CarouselItem>
              ))}
              </CarouselContent>
              <CarouselPrevious className="flex left-8" />
              <CarouselNext className="flex right-4" />
          </Carousel>
        </SortableContext>
        <DragOverlay>
          {activeCard ? (
            <div className="p-1 h-full w-full scale-105 transition-all duration-200 ease-out" style={{ zIndex: 200 }}>
              <Flashcard
                card={activeCard}
                onEdit={onEdit}
                onDelete={onDelete}
                editMode={editMode}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
        <div className="py-2 text-center text-sm text-muted-foreground mt-4 animate-fade-in">
            Card {current} of {total}
        </div>
    </div>
  );
}