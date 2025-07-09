'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, GripVertical, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import type { Flashcard } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableCardItem({ id, card, onDelete, onNavigate, index, activeCardIndex }: { id: string, card: Flashcard, onDelete: (id: string) => void, onNavigate: (id: string) => void, index: number, activeCardIndex: number }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            <Card className={cn("flex items-center p-2 pl-4 bg-card/80 backdrop-blur-sm", index === activeCardIndex && "bg-primary/10 border border-primary")}>
                <span 
                    className="flex-1 truncate pr-4 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onNavigate(id)}
                >
                    {card.question}
                </span>
                <Button variant="ghost" size="icon" onClick={() => onDelete(id)} className="mr-2">
                    <X className="h-4 w-4" />
                </Button>
                <div {...attributes} {...listeners} className="cursor-grab p-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
            </Card>
        </div>
    );
}

function AddCardDropZone({ onClick, isVisible }: { onClick: () => void; isVisible: boolean }) {
    const [isOver, setIsOver] = useState(false);

    if (!isVisible) return null;

    return (
        <div
            className="relative h-10 flex items-center justify-center cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onMouseEnter={() => setIsOver(true)}
            onMouseLeave={() => setIsOver(false)}
        >
            <div className={cn(
                "w-full h-1 bg-primary/20 rounded-full transition-all duration-300",
                isOver && "h-2 bg-primary/40"
            )}></div>
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Plus className="h-5 w-5 text-primary/80" />
                </div>
            )}
        </div>
    );
}

type CardListSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    cards: Flashcard[];
    onReorder: (oldIndex: number, newIndex: number) => void;
    onDelete: (id: string) => void;
    onAdd: (index: number) => void;
    onNavigate: (id: string) => void;
    activeCardIndex: number;
}

export default function CardListSidebar({ isOpen, onClose, cards, onReorder, onDelete, onAdd, onNavigate, activeCardIndex }: CardListSidebarProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (isOpen && itemRefs.current[activeCardIndex]) {
            itemRefs.current[activeCardIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeCardIndex, isOpen]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex(c => c.id === active.id);
            const newIndex = cards.findIndex(c => c.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    const activeCard = activeId ? cards.find(c => c.id === activeId) : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 right-0 h-full w-full max-w-md bg-background/80 backdrop-blur-xl border-l border-border shadow-2xl z-50 flex flex-col"
                >
                    <header className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-semibold">Card View</h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                <AddCardDropZone onClick={() => onAdd(0)} isVisible={true} />
                                {cards.map((card, index) => (
                                    <div key={card.id} ref={el => itemRefs.current[index] = el}>
                                        <SortableCardItem id={card.id} card={card} onDelete={onDelete} onNavigate={onNavigate} index={index} activeCardIndex={activeCardIndex} />
                                        <AddCardDropZone onClick={() => onAdd(index + 1)} isVisible={true} />
                                    </div>
                                ))}
                            </SortableContext>
                            <DragOverlay>
                                {activeCard ? (
                                    <Card className="flex items-center p-2 pl-4 bg-card shadow-lg">
                                        <span className="flex-1 truncate pr-4">{activeCard.question}</span>
                                        <div className="p-2">
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </Card>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}