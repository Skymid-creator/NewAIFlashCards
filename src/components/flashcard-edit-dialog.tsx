'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Flashcard } from '@/types';
import { useEffect } from 'react';

type FlashcardEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Flashcard;
  onSave: (question: string, answer: string) => void;
};

const formSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters.'),
  answer: z.string().min(1, 'Answer cannot be empty.'),
});

export default function FlashcardEditDialog({
  open,
  onOpenChange,
  card,
  onSave,
}: FlashcardEditDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: card.question,
      answer: card.answer,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        question: card.question,
        answer: card.answer,
      });
    }
  }, [open, card, reset]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onSave(data.question, data.answer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>
              Make changes to your flashcard here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="question">Question</Label>
              <Controller
                name="question"
                control={control}
                render={({ field }) => (
                  <Input id="question" {...field} />
                )}
              />
              {errors.question && (
                <p className="text-sm text-destructive">{errors.question.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="answer">Answer</Label>
               <Controller
                name="answer"
                control={control}
                render={({ field }) => (
                  <Textarea id="answer" {...field} rows={5} className="whitespace-pre-wrap"/>
                )}
              />
              {errors.answer && (
                <p className="text-sm text-destructive">{errors.answer.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
