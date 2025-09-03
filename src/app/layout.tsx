import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { SummaryProvider } from '@/context/SummaryContext';
import { SummarySidebar } from '@/components/summary-sidebar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Skymid Flashcards',
  description: 'AI-powered flashcard generator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", inter.variable)}>
        <SummaryProvider>
          {children}
        </SummaryProvider>
        <Toaster />
      </body>
    </html>
  );
}
