import { Flashcard } from '@/types';

export interface SavedFlashcardSet {
  id: string;
  name: string;
  timestamp: number;
  flashcards: Flashcard[];
}

const LOCAL_STORAGE_KEY = 'skymid_flashcard_sets';

export const getAllSavedSetsMetadata = (): Omit<SavedFlashcardSet, 'flashcards'>[] => {
  if (typeof window === 'undefined') return [];
  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!storedData) return [];
  try {
    const allSets: SavedFlashcardSet[] = JSON.parse(storedData);
    return allSets.map(({ id, name, timestamp }) => ({ id, name, timestamp }));
  } catch (error) {
    console.error('Failed to parse flashcard sets from local storage:', error);
    return [];
  }
};

export const getSavedSet = (id: string): SavedFlashcardSet | null => {
  if (typeof window === 'undefined') return null;
  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!storedData) return null;
  try {
    const allSets: SavedFlashcardSet[] = JSON.parse(storedData);
    return allSets.find(set => set.id === id) || null;
  } catch (error) {
    console.error('Failed to parse flashcard sets from local storage:', error);
    return null;
  }
};

export const saveFlashcardSet = (set: SavedFlashcardSet): void => {
  if (typeof window === 'undefined') return;
  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  let allSets: SavedFlashcardSet[] = [];
  if (storedData) {
    try {
      allSets = JSON.parse(storedData);
    } catch (error) {
      console.error('Failed to parse existing flashcard sets from local storage:', error);
    }
  }

  const existingIndex = allSets.findIndex(s => s.id === set.id);
  if (existingIndex > -1) {
    allSets[existingIndex] = set; // Update existing set
  } else {
    allSets.push(set); // Add new set
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSets));
};

export const deleteSavedSet = (id: string): void => {
  if (typeof window === 'undefined') return;
  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!storedData) return;
  try {
    let allSets: SavedFlashcardSet[] = JSON.parse(storedData);
    allSets = allSets.filter(set => set.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSets));
  } catch (error) {
    console.error('Failed to parse flashcard sets from local storage during deletion:', error);
  }
};

export const updateSavedSetName = (id: string, newName: string): void => {
  if (typeof window === 'undefined') return;
  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!storedData) return;
  try {
    let allSets: SavedFlashcardSet[] = JSON.parse(storedData);
    const setIndex = allSets.findIndex(set => set.id === id);
    if (setIndex > -1) {
      allSets[setIndex].name = newName;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSets));
    }
  } catch (error) {
    console.error('Failed to parse flashcard sets from local storage during rename:', error);
  }
};
