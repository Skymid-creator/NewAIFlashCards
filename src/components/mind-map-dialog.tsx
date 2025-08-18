import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, ChevronDown } from 'lucide-react';

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
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Store markdown internally to persist across open/close
  const [internalMarkdown, setInternalMarkdown] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Store expanded node paths to persist across open/close
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Update internal markdown when prop changes
  useEffect(() => {
    if (markdown && markdown !== internalMarkdown) {
      console.log('New markdown received:', markdown.substring(0, 100) + '...');
      setInternalMarkdown(markdown);
      setHasGenerated(true);
      setExpandedPaths(new Set()); // Clear expanded state for new mindmap
      setShowNotification(true);
      
      // Hide notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [markdown, internalMarkdown]);

  // Function to get node path for unique identification
  const getNodePath = (node: any, path: string = ''): string => {
    const nodeText = node.content || node.v || '';
    return path ? `${path}>${nodeText}` : nodeText;
  };

  // Function to collapse nodes recursively and restore state
  const setNodeFoldState = (node: any, path: string = '') => {
    if (!node) return;
    
    const currentPath = getNodePath(node, path);
    
    if (node.children && node.children.length > 0) {
      // For root node, keep it expanded
      if (path === '') {
        node.payload = { ...node.payload, fold: 0 };
      } else {
        // For other nodes, check if they should be expanded based on saved state
        const shouldExpand = expandedPaths.has(currentPath);
        node.payload = { ...node.payload, fold: shouldExpand ? 0 : 1 };
      }
      
      // Recursively process children
      node.children.forEach((child: any) => {
        setNodeFoldState(child, currentPath);
      });
    }
  };

  // Function to save current expanded state
  const saveExpandedState = () => {
    if (!mmRef.current?.state?.data) return;
    
    const newExpandedPaths = new Set<string>();
    
    const traverseNode = (node: any, path: string = '') => {
      if (!node) return;
      
      const currentPath = getNodePath(node, path);
      
      // If node has children and is not folded, it's expanded
      if (node.children && node.children.length > 0 && node.payload?.fold !== 1) {
        newExpandedPaths.add(currentPath);
        
        node.children.forEach((child: any) => {
          traverseNode(child, currentPath);
        });
      }
    };
    
    traverseNode(mmRef.current.state.data);
    setExpandedPaths(newExpandedPaths);
    console.log('Saved expanded paths:', Array.from(newExpandedPaths));
  };

  // Create and destroy mind map instance
  useEffect(() => {
    if (isOpen && internalMarkdown && svgRef.current) {
      const transformer = new Transformer();
      const { root } = transformer.transform(internalMarkdown);
      
      console.log('Creating new Markmap instance on open');
      
      setNodeFoldState(root);
      
      const mm = Markmap.create(svgRef.current, {
        autoFit: true,
        duration: 300
      }, root);
      mmRef.current = mm;

      const originalRescale = mm.rescale.bind(mm);
      mm.rescale = function(...args: any[]) {
        const result = originalRescale(...args);
        setTimeout(() => {
          saveExpandedState();
        }, 50);
        return result;
      };

      return () => {
        console.log('Destroying Markmap instance');
        saveExpandedState();
        mm.destroy();
        mmRef.current = undefined;
      };
    }
  }, [isOpen, internalMarkdown, expandedPaths.size]);

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
          onClose();
        }
      }
    };

    const svgNode = mmRef.current.svg.node();
    svgNode.addEventListener('click', clickListener);

    return () => {
      svgNode.removeEventListener('click', clickListener);
    };
  }, [mmRef.current, onNavigate, onClose]);

  // Fit mind map when sidebar opens
  useEffect(() => {
    if (isOpen && mmRef.current && internalMarkdown) {
      const timer = setTimeout(() => {
        console.log('Fitting mind map after sidebar animation');
        mmRef.current?.fit();
      }, 350);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, internalMarkdown]);

  // Click outside handler for download menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    console.log('Clearing mind map');
    if (mmRef.current) {
      mmRef.current.destroy();
      mmRef.current = undefined;
    }
    setInternalMarkdown('');
    setHasGenerated(false);
    setExpandedPaths(new Set());
    setShowNotification(false);
    onClear();
  };

  const handleGenerate = () => {
    console.log('Generate button clicked');
    setExpandedPaths(new Set());
    onGenerate();
  };

  const handleDownload = async (format: 'png' | 'svg' = 'png', quality: 'standard' | 'high' | 'ultra' = 'high') => {
    if (!internalMarkdown || !mmRef.current) {
      console.error('No markdown or markmap instance available for download');
      return;
    }

    console.log(`Starting mind map download in ${format} format with ${quality} quality...`);

    try {
      const currentMm = mmRef.current;
      const originalState = currentMm.state.data;
      
      const transformer = new Transformer();
      const { root } = transformer.transform(internalMarkdown);
      
      const traverseAndExpand = (node: any) => {
        if (node.children) {
          node.payload = { ...node.payload, fold: 0 };
          node.children.forEach(traverseAndExpand);
        }
      };
      traverseAndExpand(root);

      currentMm.setData(root);
      await new Promise(resolve => setTimeout(resolve, 200));
      await currentMm.fit();
      await new Promise(resolve => setTimeout(resolve, 600));

      if (format === 'svg') {
        const svgEl = currentMm.svg.node() as SVGSVGElement;
        const svgData = createHighQualitySVG(svgEl);
        
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mind-map.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        currentMm.setData(originalState);
        setTimeout(() => currentMm.fit(), 100);
        return;
      }

      const svgEl = currentMm.svg.node() as SVGSVGElement;
      const bbox = svgEl.getBBox();
      
      // Quality settings with reduced padding for better screen real estate usage
      const qualitySettings = {
        standard: { scale: 2, padding: 40 },
        high: { scale: 4, padding: 40 },
        ultra: { scale: 6, padding: 40 }
      };
      
      const settings = qualitySettings[quality];
      const scale = settings.scale;
      const padding = settings.padding;

      const canvas = document.createElement('canvas');
      canvas.width = (bbox.width + padding * 2) * scale;
      canvas.height = (bbox.height + padding * 2) * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.scale(scale, scale);
      
      const svgData = createHighQualitySVG(svgEl, bbox, padding, scale);

      const img = new Image();
      img.onload = () => {
        try {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
          ctx.drawImage(img, 0, 0, canvas.width / scale, canvas.height / scale);
          
          const pngUrl = canvas.toDataURL('image/png', 1.0);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `mind-map-${quality}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(img.src);
          
          console.log(`Mind map download complete (${quality} quality, ${scale}x scale).`);
        } catch (error) {
          console.error('Error during canvas rendering:', error);
          alert('Failed to generate image. Please try again.');
        } finally {
          currentMm.setData(originalState);
          setTimeout(() => currentMm.fit(), 100);
        }
      };

      img.onerror = (error) => {
        console.error('Failed to load SVG image:', error);
        alert('Failed to process SVG for download. Please try again.');
        currentMm.setData(originalState);
        setTimeout(() => currentMm.fit(), 100);
      };

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      img.src = URL.createObjectURL(svgBlob);

    } catch (error) {
      console.error('Error during mind map download:', error);
      alert('Failed to download mind map. Please try again.');
    }
  };
  
  // Helper function to create high-quality SVG with reduced default padding
  const createHighQualitySVG = (svgEl: SVGSVGElement, bbox?: DOMRect, padding = 40, scale = 4): string => {
    const actualBbox = bbox || svgEl.getBBox();
    const svgClone = svgEl.cloneNode(true) as SVGSVGElement;
    
    const highQualityStyles = `
      <defs>
        <style type="text/css">
          <![CDATA[
          .markmap-node text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: ${14 * Math.min(scale / 4, 1.5)}px; font-weight: 500; fill: #1f2937; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          .markmap-node rect { stroke: #d1d5db; stroke-width: ${1.5 * Math.min(scale / 4, 1.2)}px; fill: #ffffff; rx: ${8 * Math.min(scale / 4, 1.2)}px; ry: ${8 * Math.min(scale / 4, 1.2)}px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
          .markmap-link { stroke: #6b7280; stroke-width: ${2 * Math.min(scale / 4, 1.2)}px; fill: none; stroke-linecap: round; stroke-linejoin: round; }
          .markmap-fold circle { fill: #ffffff; stroke: #6b7280; stroke-width: ${2 * Math.min(scale / 4, 1.2)}px; }
          ]]>
        </style>
      </defs>
    `;
    
    const existingStyles = svgClone.querySelectorAll('style, defs');
    existingStyles.forEach(el => el.remove());
    svgClone.insertAdjacentHTML('afterbegin', highQualityStyles);
    
    const finalWidth = actualBbox.width + padding * 2;
    const finalHeight = actualBbox.height + padding * 2;
    const offsetX = actualBbox.x - padding;
    const offsetY = actualBbox.y - padding;
    
    svgClone.setAttribute('width', finalWidth.toString());
    svgClone.setAttribute('height', finalHeight.toString());
    svgClone.setAttribute('viewBox', `${offsetX} ${offsetY} ${finalWidth} ${finalHeight}`);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('shape-rendering', 'geometricPrecision');
    svgClone.setAttribute('text-rendering', 'optimizeLegibility');
    
    return new XMLSerializer().serializeToString(svgClone);
  };

  const handleClose = () => {
    saveExpandedState();
    onClose();
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
            <style>{`.markmap-node text { font-size: 14px; font-family: var(--font-sans); } .markmap-node a { cursor: pointer; } .markmap-node rect { stroke: hsl(var(--border)); stroke-width: 1.5px; fill: hsl(var(--card)); rx: 8px; ry: 8px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); transition: all 0.2s ease-in-out; } .markmap-node:hover > rect { fill: hsl(var(--accent)); stroke: hsl(var(--accent-foreground)); } .markmap-node:hover > text a { fill: hsl(var(--accent-foreground)); } .markmap-link { stroke: hsl(var(--primary)/0.5); stroke-width: 2px; } .markmap-fold { cursor: pointer; }`}</style>
            
            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 z-60 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Mind map generated successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <header className="flex items-center justify-between p-4 border-b border-border bg-background/50">
              <div>
                <h2 className="text-lg font-semibold">Mind Map</h2>
                {hasGenerated && (
                  <p className="text-sm text-muted-foreground">Click on node dots to expand/collapse</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : (hasGenerated ? 'Regenerate' : 'Generate Mind Map')}
                </Button>
                <Button onClick={handleClear} disabled={!hasGenerated || isGenerating} variant="outline">
                  Clear
                </Button>
                
                <div className="relative" ref={downloadMenuRef}>
                  <Button 
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    disabled={!hasGenerated || isGenerating} 
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    Download
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  
                  <AnimatePresence>
                    {showDownloadMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full mt-2 right-0 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[180px] p-1"
                      >
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold">PNG Quality</div>
                        <button
                          onClick={() => { handleDownload('png', 'standard'); setShowDownloadMenu(false); }}
                          className="w-full text-left rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          Standard (2x)
                        </button>
                        <button
                          onClick={() => { handleDownload('png', 'high'); setShowDownloadMenu(false); }}
                          className="w-full text-left rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          High (4x) <span className="opacity-70"> - Recommended</span>
                        </button>
                        <button
                          onClick={() => { handleDownload('png', 'ultra'); setShowDownloadMenu(false); }}
                          className="w-full text-left rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          Ultra (6x)
                        </button>
                        <div className="my-1 h-px bg-border" />
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold">Vector</div>
                        <button
                          onClick={() => { handleDownload('svg'); setShowDownloadMenu(false); }}
                          className="w-full text-left rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          SVG (Scalable)
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className="flex-grow relative overflow-hidden">
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-lg">Generating mind map...</p>
                  </div>
                </div>
              )}
              
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