"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  getAllSavedSetsMetadata,
  deleteSavedSet,
  updateSavedSetName,
  SavedFlashcardSet,
} from "@/lib/local-storage-utils";
import { format } from "date-fns";
import { Trash2, Edit, FolderOpen } from "lucide-react";

interface FlashcardManagerDialogProps {
  onOpenSet: (setId: string) => void;
  children?: React.ReactNode;
}

export function FlashcardManagerDialog({
  onOpenSet,
  children,
}: FlashcardManagerDialogProps) {
  const [savedSets, setSavedSets] = useState<
    Omit<SavedFlashcardSet, "flashcards">[]
  >([]);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);
  const [setBeingEdited, setSetBeingEdited] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState<string>("");
  const { toast } = useToast();

  const loadSavedSets = () => {
    setSavedSets(getAllSavedSetsMetadata());
  };

  useEffect(() => {
    loadSavedSets();
  }, [isAlertDialogOpen]); // Reload when dialog opens/closes

  const handleDeleteClick = (id: string) => {
    setSetToDelete(id);
    setIsAlertDialogOpen(true);
  };

  const confirmDelete = () => {
    if (setToDelete) {
      deleteSavedSet(setToDelete);
      loadSavedSets();
      toast({
        title: "Flashcard Set Deleted",
        description: "The selected flashcard set has been removed.",
      });
      setSetToDelete(null);
    }
    setIsAlertDialogOpen(false);
  };

  const handleEditClick = (id: string, currentName: string) => {
    setSetBeingEdited(id);
    setNewSetName(currentName);
  };

  const handleSaveName = () => {
    if (setBeingEdited && newSetName.trim() !== "") {
      updateSavedSetName(setBeingEdited, newSetName.trim());
      loadSavedSets();
      toast({
        title: "Set Name Updated",
        description: "The flashcard set name has been updated.",
      });
      setSetBeingEdited(null);
      setNewSetName("");
    } else {
      toast({
        title: "Error",
        description: "Set name cannot be empty.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Manage Saved Flashcard Sets</AlertDialogTitle>
          <AlertDialogDescription>
            Here you can view, open, rename, or delete your previously saved
            flashcard sets.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {savedSets.length === 0 ? (
            <p className="text-center text-gray-500">No flashcard sets saved yet.</p>
          ) : (
            <div className="space-y-4">
              {savedSets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between rounded-md border p-3 shadow-sm"
                >
                  {setBeingEdited === set.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Label htmlFor="newSetName" className="sr-only">New Set Name</Label>
                      <Input
                        id="newSetName"
                        value={newSetName}
                        onChange={(e) => setNewSetName(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveName();
                          }
                        }}
                      />
                      <Button onClick={handleSaveName} size="sm">
                        Save
                      </Button>
                      <Button
                        onClick={() => setSetBeingEdited(null)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{set.name}</p>
                      <p className="text-sm text-gray-500">
                        Saved: {format(new Date(set.timestamp), "PPP p")}
                      </p>
                    </div>
                  )}
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onOpenSet(set.id)}
                      title="Open Set"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(set.id, set.name)}
                      title="Rename Set"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteClick(set.id)}
                      title="Delete Set"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={setToDelete !== null} onOpenChange={setSetToDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              flashcard set from your local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSetToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialog>
  );
}
