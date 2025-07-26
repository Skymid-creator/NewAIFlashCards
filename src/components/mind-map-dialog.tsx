import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface MindMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Array<{id: string; question: string; answer: string}>;
  onNavigate: (id: string) => void;
  markdown: string;
  onGenerate: () => void;
  isGenerating: boolean;
  onClear: () => void;
}

const MindMapDialog: React.FC<MindMapDialogProps> = ({
  isOpen,
  onClose,
  flashcards,
  onNavigate,
  markdown,
  onGenerate,
  isGenerating,
  onClear
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap>();
  
  // Store markdown internally to persist across open/close
  const [internalMarkdown, setInternalMarkdown] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  // Update internal markdown when prop changes
  useEffect(() => {
    if (markdown && markdown !== internalMarkdown) {
      console.log('New markdown received:', markdown.substring(0, 100) + '...');
      setInternalMarkdown(markdown);
      setHasGenerated(true);
    }
  }, [markdown, internalMarkdown]);

  // Create and destroy mind map instance based on visibility and markdown content
  useEffect(() => {
    if (isOpen && internalMarkdown && svgRef.current) {
      const transformer = new Transformer();
      const { root } = transformer.transform(internalMarkdown);
      
      console.log('Creating new Markmap instance on open');
      const mm = Markmap.create(svgRef.current, undefined, root);
      mmRef.current = mm;

      // Cleanup function to destroy the instance when the sidebar closes or markdown changes
      return () => {
        console.log('Destroying Markmap instance');
        mm.destroy();
        mmRef.current = undefined;
      };
    }
  }, [isOpen, internalMarkdown]);

  // Add click listener for navigation
  useEffect(() => {
    if (!mmRef.current) return;

    const clickListener = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      const link = target.closest('a');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute('href');
        if (href && href.startsWith('flashcard://')) {
          const flashcardId = href.substring('flashcard://'.length);
          console.log(`Navigating to flashcard: ${flashcardId}`);
          onNavigate(flashcardId);
          onClose(); // Close sidebar on navigation
        }
      }
    };

    const svgNode = mmRef.current.svg.node();
    svgNode.addEventListener('click', clickListener);

    return () => {
      svgNode.removeEventListener('click', clickListener);
    };
  }, [mmRef.current, onNavigate, onClose]);

  // Fit mind map when sidebar opens (with delay for animation)
  useEffect(() => {
    if (isOpen && mmRef.current && internalMarkdown) {
      const timer = setTimeout(() => {
        console.log('Fitting mind map after sidebar animation');
        mmRef.current?.fit();
      }, 350); // Wait for animation to complete
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, internalMarkdown]);

  const handleClear = () => {
    console.log('Clearing mind map');
    if (mmRef.current) {
      mmRef.current.destroy();
      mmRef.current = undefined;
    }
    setInternalMarkdown('');
    setHasGenerated(false);
    onClear();
  };

  const handleGenerate = () => {
    console.log('Generate button clicked');
    onGenerate();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-4xl bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 flex flex-col"
          >
            <style>{`
              .markmap-node text {
                font-size: 14px;
                font-family: var(--font-sans);
              }
              .markmap-node a {
                cursor: pointer;
              }
              .markmap-node rect {
                stroke: hsl(var(--border));
                stroke-width: 1.5px;
                fill: hsl(var(--card));
                rx: 8px;
                ry: 8px;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
                transition: all 0.2s ease-in-out;
              }
              .markmap-node:hover > rect {
                fill: hsl(var(--accent));
                stroke: hsl(var(--accent-foreground));
              }
              .markmap-node:hover > text a {
                fill: hsl(var(--accent-foreground));
              }
              .markmap-link {
                stroke: hsl(var(--primary)/0.5);
                stroke-width: 2px;
              }
            `}</style>
            
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-border bg-background/50">
              <h2 className="text-lg font-semibold">Mind Map</h2>
              <div className="flex items-center gap-2">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : (hasGenerated ? 'Regenerate' : 'Generate Mind Map')}
                </Button>
                <Button onClick={handleClear} disabled={!hasGenerated || isGenerating} variant="outline">
                  Clear
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Content */}
            <div className="flex-grow relative overflow-hidden">
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-lg">Generating mind map...</p>
                  </div>
                </div>
              )}
              
              {/* SVG Container - always rendered to preserve Markmap instance */}
              <svg 
                ref={svgRef} 
                className={`w-full h-full ${internalMarkdown ? 'block' : 'hidden'}`}
              />
              
              {!hasGenerated && !isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-md px-8">
                    <div className="text-6xl mb-4 opacity-20">🧠</div>
                    <h3 className="text-xl font-semibold mb-2">No Mind Map Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Generate a mind map from your flashcards to visualize connections and improve understanding.
                    </p>
                    <Button onClick={handleGenerate} size="lg" className="px-8" disabled={flashcards.length === 0}>
                      {flashcards.length === 0 ? 'No Flashcards' : 'Generate Mind Map'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MindMapDialog;