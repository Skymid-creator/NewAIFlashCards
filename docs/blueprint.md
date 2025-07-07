# **App Name**: Skymid Flashcards

## Core Features:

- AI Flashcard Generation: Utilize the Google Gemini API with a provided 'SystemPrompt.txt' file in the 'skymid' folder as a tool to generate flashcards from user input.
- Scrollable Flashcard UI: Implement a side-scrollable UI for flashcard display, showing one current card with portions of the previous and next cards.
- Flashcard Highlighting: Visually indicate previous and next flashcards by greying them out. Highlight the current flashcard by making it fully opaque and centered.
- Flashcard Editing: Incorporate an edit button for modifying the flashcard content.
- Swipe-to-Delete Functionality: Enable swipe gestures (up or down) to delete a flashcard, with a color change during the swipe action, similar to dating app interfaces.

## Style Guidelines:

- Primary color: HSL(210, 70%, 50%) / RGB(#3399FF). This is a bright, versatile blue reminiscent of educational software and cloud services.
- Background color: HSL(210, 20%, 95%) / RGB(#F0F8FF). A very light blue tint maintains the app's aesthetic while minimizing distraction.
- Accent color: HSL(180, 70%, 50%) / RGB(#33FFFF). This bright cyan will highlight interactive elements while maintaining a visual relationship to the primary.
- Body and headline font: 'Inter', a sans-serif typeface suitable for headlines or body text. 
- Use subtle transition animations when scrolling between flashcards, including the grey-out and focus effects.
- Flashcards should occupy the majority of the screen, ensuring easy readability. The edit button should be easily accessible but non-obtrusive.