export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  diagram?: { url: string; contentType: string; };
};
