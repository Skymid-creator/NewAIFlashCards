import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, ChevronDown, Paintbrush } from 'lucide-react';
import { zoomIdentity, zoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';

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

type ViewTransform = { k: number; x: number; y: number };

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
  const styleRef = useRef<HTMLStyleElement>(null);

  const [internalMarkdown, setInternalMarkdown] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [highlightedNodes, setHighlightedNodes] = useState<Record<string, string>>({});
  
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [viewTransform, setViewTransform] = useState<ViewTransform | null>(null);
  
  // Track if this is the initial load for new markdown
  const [isNewMarkdown, setIsNewMarkdown] = useState(false);

  useEffect(() => {
    if (markdown && markdown !== internalMarkdown) {
      console.log('New markdown received:', markdown.substring(0, 100) + '...');
      setInternalMarkdown(markdown);
      setHasGenerated(true);
      setExpandedPaths(new Set()); 
      setIsNewMarkdown(true); // Mark as new content
      setShowNotification(true);
      
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [markdown, internalMarkdown]);

  const getNodePath = (node: any, path: string = ''): string => {
    const nodeText = node.content || node.v || '';
    return path ? `${path}>${nodeText}` : nodeText;
  };

  const setNodeFoldState = (node: any, path: string = '') => {
    if (!node) return;
    const currentPath = getNodePath(node, path);
    if (node.children && node.children.length > 0) {
      if (path === '') {
        node.payload = { ...node.payload, fold: 0 };
      } else {
        const shouldExpand = expandedPaths.has(currentPath);
        node.payload = { ...node.payload, fold: shouldExpand ? 0 : 1 };
      }
      node.children.forEach((child: any) => {
        setNodeFoldState(child, currentPath);
      });
    }
  };

  const saveExpandedState = () => {
    if (!mmRef.current?.state?.data) return;
    const newExpandedPaths = new Set<string>();
    const traverseNode = (node: any, path: string = '') => {
      if (!node) return;
      const currentPath = getNodePath(node, path);
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

  const saveViewState = () => {
    if (mmRef.current?.svg?.node()) {
      const transform = zoomTransform(mmRef.current.svg.node());
      setViewTransform({ k: transform.k, x: transform.x, y: transform.y });
      console.log('View state saved:', transform);
    }
  };

  // Restore view transform with smooth transition
  const restoreViewState = (mm: Markmap) => {
    if (viewTransform) {
      console.log('Restoring view state:', viewTransform);
      const d3Transform = zoomIdentity
        .translate(viewTransform.x, viewTransform.y)
        .scale(viewTransform.k);
      
      // Apply transform smoothly
      mm.svg.transition()
        .duration(300)
        .call(mm.zoom.transform, d3Transform);
    }
  };

  // Create and destroy mind map instance
  useEffect(() => {
    if (isOpen && internalMarkdown && svgRef.current) {
      const transformer = new Transformer();
      const { root } = transformer.transform(internalMarkdown);
      
      console.log('Creating new Markmap instance');
      
      setNodeFoldState(root);
      
      const mm = Markmap.create(svgRef.current, {
        autoFit: false, // Prevent automatic zoom changes
        duration: 300
      }, root);
      mmRef.current = mm;

      // Handle initial view setup
      if (isNewMarkdown) {
        // For new content, fit to view and then save the position
        console.log('New markdown - fitting to view');
        mm.fit();
        setIsNewMarkdown(false);
        // Save the initial fitted position
        setTimeout(() => saveViewState(), 400);
      } else if (viewTransform) {
        // For existing content, restore the saved position
        setTimeout(() => restoreViewState(mm), 100);
      } else {
        // Fallback: fit to view
        mm.fit();
        setTimeout(() => saveViewState(), 400);
      }

      // Save state on user interactions
      const svgNode = mm.svg.node();
      const handleInteractionEnd = () => saveViewState();
      
      // Debounce the save to avoid excessive calls
      let saveTimeout: NodeJS.Timeout;
      const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveViewState();
        }, 150);
      };
      
      svgNode.addEventListener('mouseup', debouncedSave);
      svgNode.addEventListener('touchend', debouncedSave);
      svgNode.addEventListener('wheel', debouncedSave);
      
      // Override rescale to save expansion state and maintain view
      const originalRescale = mm.rescale.bind(mm);
      mm.rescale = function(...args: any[]) {
        // Save current transform before rescaling
        const currentTransform = zoomTransform(svgNode);
        
        const result = originalRescale(...args);
        
        // Save expanded state
        setTimeout(() => {
          saveExpandedState();
          
          // Restore view position after expansion/collapse
          if (currentTransform && (currentTransform.k !== 1 || currentTransform.x !== 0 || currentTransform.y !== 0)) {
            const newTransform = zoomIdentity
              .translate(currentTransform.x, currentTransform.y)
              .scale(currentTransform.k);
            mm.zoom.transform(mm.svg, newTransform);
            saveViewState();
          }
        }, 350);
        
        return result;
      };

      return () => {
        console.log('Destroying Markmap instance');
        saveExpandedState();
        saveViewState(); 
        
        clearTimeout(saveTimeout);
        svgNode.removeEventListener('mouseup', debouncedSave);
        svgNode.removeEventListener('touchend', debouncedSave);
        svgNode.removeEventListener('wheel', debouncedSave);
        mm.destroy();
        mmRef.current = undefined;
      };
    }
  }, [isOpen, internalMarkdown, isNewMarkdown]); // Include isNewMarkdown in dependencies

  // Add click listener for navigation and highlighting
  useEffect(() => {
    if (!mmRef.current) return;

    const clickListener = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      const nodeEl = target.closest('.markmap-node');

      if (isHighlightMode) {
        if (nodeEl) {
          e.preventDefault();
          e.stopPropagation();

          const d3selection = select(nodeEl);
          const nodeData = d3selection.datum() as any;
          const nodeKey = nodeData.state.key;

          setHighlightedNodes(prev => {
            const newHighlightedNodes = { ...prev };
            if (newHighlightedNodes[nodeKey]) {
              delete newHighlightedNodes[nodeKey];
            } else {
              newHighlightedNodes[nodeKey] = highlightColor;
            }
            return newHighlightedNodes;
          });
        }
        return;
      }
      
      // Prevent navigation when clicking the fold/unfold button
      if (target.closest('.markmap-fold')) return;

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
  }, [mmRef.current, onNavigate, onClose, isHighlightMode, highlightColor]);

  // Apply highlight classes to nodes
  useEffect(() => {
    if (!mmRef.current || !hasGenerated) return;

    mmRef.current.svg.selectAll('.markmap-node').each(function() {
      const d3selection = select(this);
      const nodeData = d3selection.datum() as any;
      const nodeKey = nodeData.state.key;
      const color = highlightedNodes[nodeKey];

      this.classList.remove('highlight-yellow', 'highlight-blue', 'highlight-green', 'highlight-red');

      if (color) {
        this.classList.add(`highlight-${color}`);
      }
    });
  }, [highlightedNodes, hasGenerated, isOpen]);

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
    setViewTransform(null); 
    setIsNewMarkdown(false);
    setShowNotification(false);
    onClear();
  };

  const handleGenerate = () => {
    console.log('Generate button clicked');
    setExpandedPaths(new Set());
    setViewTransform(null); // Reset view for regeneration
    setIsNewMarkdown(true); // Mark as new content
    onGenerate();
  };

  const prepareMindmapForDownload = async (mm: Markmap) => {
    const originalState = mm.state.data;
    const originalTransform = zoomTransform(mm.svg.node());

    const transformer = new Transformer();
    const { root } = transformer.transform(internalMarkdown);

    const traverseAndExpand = (node: any) => {
      if (node.children) {
        node.payload = { ...node.payload, fold: 0 };
        node.children.forEach(traverseAndExpand);
      }
    };
    traverseAndExpand(root);

    mm.setData(root);
    await new Promise(resolve => setTimeout(resolve, 200));
    await mm.fit();
    await new Promise(resolve => setTimeout(resolve, 600));

    return { originalState, originalTransform };
  };

  const restoreMindmapView = (mm: Markmap, originalState: any, originalTransform: any) => {
    mm.setData(originalState);
    setTimeout(() => {
      const restoreTransform = zoomIdentity
        .translate(originalTransform.x, originalTransform.y)
        .scale(originalTransform.k);
      mm.zoom.transform(mm.svg, restoreTransform);
    }, 100);
  };

  const downloadAsSvg = (mm: Markmap) => {
    const svgEl = mm.svg.node() as SVGSVGElement;
    const styles = styleRef.current?.textContent || '';
    const svgData = createHighQualitySVG(svgEl, styles);

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mind-map.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsPng = (mm: Markmap, quality: 'standard' | 'high' | 'ultra') => {
    const svgEl = mm.svg.node() as SVGSVGElement;
    const bbox = svgEl.getBBox();
    const styles = styleRef.current?.textContent || '';

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

    const svgData = createHighQualitySVG(svgEl, styles, bbox, padding, scale);

    const img = new Image();
    img.onload = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      }
    };

    img.onerror = (error) => {
      console.error('Failed to load SVG image:', error);
      alert('Failed to process SVG for download. Please try again.');
    };

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    img.src = URL.createObjectURL(svgBlob);
  };

  const handleDownload = async (format: 'png' | 'svg' = 'png', quality: 'standard' | 'high' | 'ultra' = 'high') => {
    if (!internalMarkdown || !mmRef.current) {
      console.error('No markdown or markmap instance available for download');
      return;
    }

    console.log(`Starting mind map download in ${format} format with ${quality} quality...`);
    const currentMm = mmRef.current;
    let originalState: any, originalTransform: any;

    try {
      ({ originalState, originalTransform } = await prepareMindmapForDownload(currentMm));

      if (format === 'svg') {
        downloadAsSvg(currentMm);
      } else {
        downloadAsPng(currentMm, quality);
      }
    } catch (error) {
      console.error('Error during mind map download:', error);
      alert('Failed to download mind map. Please try again.');
    } finally {
      if (originalState && originalTransform) {
        restoreMindmapView(currentMm, originalState, originalTransform);
      }
    }
  };
  
  const createHighQualitySVG = (svgEl: SVGSVGElement, styles: string, bbox?: DOMRect, padding = 40, scale = 4): string => {
    const actualBbox = bbox || svgEl.getBBox();
    const svgClone = svgEl.cloneNode(true) as SVGSVGElement;
    
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.appendChild(styleEl);
    
    const existingStyles = svgClone.querySelectorAll('style, defs');
    existingStyles.forEach(el => el.remove());
    svgClone.insertAdjacentElement('afterbegin', defs);
    
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
    // Always save state before closing
    saveExpandedState();
    saveViewState();
    onClose();
  };

  // Save state when dialog becomes hidden (but don't clear the markmap)
  useEffect(() => {
    if (!isOpen && mmRef.current) {
      console.log('Dialog closed - saving final state');
      saveExpandedState();
      saveViewState();
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col"
          >
            <style ref={styleRef}>{`
              .markmap-node text {
                font-size: 15px;
                font-family: var(--font-sans);
                fill: hsl(var(--foreground));
              }
              .markmap-node a {
                cursor: pointer;
              }
              .markmap-node rect {
                stroke: hsl(var(--border));
                stroke-width: 1px;
                fill: hsl(var(--card));
                rx: 8px;
                ry: 8px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
                transition: all 0.2s ease-in-out;
              }
              .markmap-node:hover > rect {
                stroke: hsl(var(--primary));
                fill: hsl(var(--accent));
              }
              .markmap-node:hover > text a {
                fill: hsl(var(--accent-foreground));
              }
              .markmap-link {
                stroke: hsl(var(--border));
                stroke-width: 1px;
              }
              .markmap-fold {
                cursor: pointer;
              }
              .markmap-fold circle {
                fill: hsl(var(--background));
                stroke: hsl(var(--border));
                stroke-width: 1px;
                transition: all 0.2s ease-in-out;
              }
              .markmap-fold:hover circle {
                fill: hsl(var(--accent));
                stroke: hsl(var(--primary));
              }
              .markmap-node.highlighted > rect {
                stroke: hsl(var(--primary));
                stroke-width: 2px;
              }
              .markmap-node.highlight-yellow > rect {
                fill: #fffbeb;
                stroke: #fde047;
              }
              .markmap-node.highlight-blue > rect {
                fill: #eff6ff;
                stroke: #60a5fa;
              }
              .markmap-node.highlight-green > rect {
                fill: #f0fdf4;
                stroke: #4ade80;
              }
              .markmap-node.highlight-red > rect {
                fill: #fef2f2;
                stroke: #f87171;
              }
            `}</style>
            
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
            
            <header className="flex items-center justify-between p-4 border-b border-border bg-background/50 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold">Mind Map</h2>
                {hasGenerated && (
                  <p className="text-sm text-muted-foreground">Click on node dots to expand/collapse • Drag to pan • Scroll to zoom</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : (hasGenerated ? 'Regenerate' : 'Generate Mind Map')}
                </Button>
                <Button onClick={handleClear} disabled={!hasGenerated || isGenerating} variant="outline">
                  Clear
                </Button>

                <div className="h-8 w-px bg-border" />

                <Button
                  onClick={() => setIsHighlightMode(!isHighlightMode)}
                  variant={isHighlightMode ? 'secondary' : 'outline'}
                  size="icon"
                  title="Highlight Mode"
                  disabled={!hasGenerated || isGenerating}
                >
                  <Paintbrush className="h-4 w-4" />
                </Button>

                <AnimatePresence>
                  {isHighlightMode && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-1 p-1 rounded-md border bg-background overflow-hidden"
                    >
                      <button onClick={() => setHighlightColor('yellow')} className={`h-6 w-6 rounded-full bg-[#fde047] border-2 ${highlightColor === 'yellow' ? 'border-primary' : 'border-transparent'} transition-all`}></button>
                      <button onClick={() => setHighlightColor('blue')} className={`h-6 w-6 rounded-full bg-[#60a5fa] border-2 ${highlightColor === 'blue' ? 'border-primary' : 'border-transparent'} transition-all`}></button>
                      <button onClick={() => setHighlightColor('green')} className={`h-6 w-6 rounded-full bg-[#4ade80] border-2 ${highlightColor === 'green' ? 'border-primary' : 'border-transparent'} transition-all`}></button>
                      <button onClick={() => setHighlightColor('red')} className={`h-6 w-6 rounded-full bg-[#f87171] border-2 ${highlightColor === 'red' ? 'border-primary' : 'border-transparent'} transition-all`}></button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
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