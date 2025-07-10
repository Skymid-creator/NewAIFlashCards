'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SummaryContextType {
  summaries: string[];
  generateSummary: (question: string, answer: string, onStart: () => void, onEnd: () => void) => Promise<void>;
  clearSummaries: () => void;
  deleteSummary: (index: number) => void;
}

const SummaryContext = createContext<SummaryContextType | undefined>(undefined);

export const SummaryProvider = ({ children }: { children: ReactNode }) => {
  const [summaries, setSummaries] = useState<string[]>([]);

  const generateSummary = async (question: string, answer: string, onStart: () => void, onEnd: () => void) => {
    onStart();
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, answer }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      const data = await response.json();
      setSummaries((prevSummaries) => [...prevSummaries, data.summary]);
    } catch (error) {
      console.error('Error generating summary:', error);
      // Optionally, add an error message to the summaries or handle it differently
    } finally {
      onEnd();
    }
  };

  const clearSummaries = () => {
    setSummaries([]);
  };

  const deleteSummary = (indexToDelete: number) => {
    setSummaries((prevSummaries) => prevSummaries.filter((_, index) => index !== indexToDelete));
  };

  return (
    <SummaryContext.Provider value={{ summaries, generateSummary, clearSummaries, deleteSummary }}>
      {children}
    </SummaryContext.Provider>
  );
};

export const useSummary = () => {
  const context = useContext(SummaryContext);
  if (context === undefined) {
    throw new Error('useSummary must be used within a SummaryProvider');
  }
  return context;
};