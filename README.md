# Skymid Flashcards

![Skymid Flashcards Logo/Banner - Placeholder, replace with actual image](https://via.placeholder.com/800x200?text=Skymid+Flashcards)

Skymid Flashcards is an AI-powered application designed to help you quickly create and manage flashcards from any text. Leveraging the power of AI, it transforms your notes, articles, or study materials into interactive flashcards, making learning and memorization more efficient.

## ✨ Features

*   **AI-Powered Flashcard Generation:** Instantly convert large blocks of text into structured question-and-answer flashcards using advanced AI models.
*   **Intuitive Flashcard Management:**
    *   **Edit Mode:** Easily modify the question and answer of any flashcard.
    *   **Delete with Undo:** Remove unwanted flashcards with the option to undo accidental deletions, restoring them to their original position.
    *   **Drag-and-Drop Reordering:** Effortlessly rearrange flashcards within the main carousel view and the sidebar.
    *   **Click-to-Add New Cards:** Add new, blank flashcards precisely where you need them with a simple click-and-place interaction, complete with visual feedback.
*   **Comprehensive Card View Sidebar:**
    *   Access a vertical list of all your flashcards.
    *   Reorder cards by dragging and dropping them within the list.
    *   Add new cards directly from the sidebar.
    *   Delete cards from the sidebar.
    *   Click on any card in the sidebar to instantly navigate to it in the main carousel view.
*   **Import & Export Functionality:**
    *   **Export:** Save your entire flashcard set as a JSON file.
    *   **Import:** Load existing flashcard sets from JSON files.
    *   **Combine Multiple Imports:** Seamlessly merge flashcards from several JSON files into your current collection.
*   **Enhanced User Feedback:**
    *   **Real-time Progress Logs:** During AI generation, a beautiful log viewer provides step-by-step updates on the process, keeping you informed.
    *   **Engaging Loading Animation:** A visually appealing animation indicates when the AI is processing your request.

## 🚀 Technologies Used

*   **Next.js:** React framework for building performant web applications.
*   **React:** JavaScript library for building user interfaces.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
*   **Dnd-kit:** A lightweight, performant, and modular drag and drop toolkit for React.
*   **Framer Motion:** A production-ready motion library for React.
*   **uuid:** For generating unique IDs for flashcards.
*   **Genkit:** (Assuming this is your AI integration layer, if not, replace with actual AI SDK/library)
*   **Gemini API:** For AI-powered flashcard generation.

## 🛠️ Installation

Follow these steps to set up and run Skymid Flashcards on your local machine.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (comes with Node.js)
*   Git

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name # Navigate into the cloned directory
    ```
    *(Replace `your-username/your-repo-name.git` with the actual GitHub repository URL you created.)*

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of your project and add your Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    *(Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key. You can obtain one from the Google AI Studio.)*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 💡 Usage

1.  **Generate Flashcards:**
    *   Paste any text into the large text area on the main page.
    *   Click the "Generate Flashcards" button. The AI will process your text, and you'll see real-time progress updates.
2.  **Edit Flashcards:**
    *   Click the "Edit" button in the header to enter edit mode.
    *   Click on the question or answer of any flashcard to modify its content.
    *   Use the "Flip Card" button below the card to switch between question and answer sides while editing.
    *   Use the left/right arrow buttons to navigate between cards in edit mode.
3.  **Add New Flashcards:**
    *   In edit mode, click the "Add Flashcard" button. A ghost card will follow your mouse.
    *   Click between existing flashcards (where a drop zone appears) to insert a new, blank flashcard.
    *   Click "Cancel" on the "Add Flashcard" button to exit add mode without adding a card.
4.  **Delete Flashcards:**
    *   In edit mode, drag a flashcard towards the top or bottom of the screen. Drop zones will appear, indicating where you can release the card to delete it.
    *   Click the "Undo" button to restore the last deleted flashcard to its original position.
5.  **View and Manage Cards (Sidebar):**
    *   Click the "View Cards" button in the header to open the sidebar.
    *   Click on any card's question in the sidebar to navigate to that card in the main view.
    *   Drag and drop cards within the sidebar to reorder them.
    *   Use the "X" icon next to each card in the sidebar to delete it.
    *   Use the "+" icon in the sidebar's drop zones to add new cards.
6.  **Import/Export:**
    *   Click "Export" to download your current flashcard set as a `flashcards.json` file.
    *   Click "Import" to select one or more `.json` files from your computer to load and combine flashcards.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.