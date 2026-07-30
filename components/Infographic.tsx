/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GeneratedImage } from '../types';
import { Download, Sparkles, Edit3, Maximize2, X, ZoomIn, ZoomOut, Pencil } from 'lucide-react';
import { ImageDownloadDropdown } from './ImageDownloadDropdown';

interface InfographicProps {
  image: GeneratedImage;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
  onAnnotate: () => void;
}

const Infographic: React.FC<InfographicProps> = ({ image, onEdit, isEditing, onAnnotate }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const clickStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Auto-grow textarea to be fully responsive
  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.style.height = 'auto';
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [editPrompt]);

  // Lock body and HTML scroll completely when in fullscreen viewer mode
  useEffect(() => {
    if (isFullscreen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHTMLOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'relative';

      const preventDefault = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          e.preventDefault();
        }
      };
      document.addEventListener('touchmove', preventDefault, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHTMLOverflow;
        document.body.style.position = originalBodyPosition;
        document.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [isFullscreen]);

  // Handle smooth scroll wheel zooming relative to mouse cursor position
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container || !isFullscreen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Stop main window and container scroll

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      setZoomLevel(prevZoom => {
        const zoomFactor = 0.15;
        const direction = e.deltaY < 0 ? 1 : -1;
        const nextZoom = Math.min(Math.max(prevZoom + direction * zoomFactor, 0.5), 6);

        if (nextZoom <= 0.9) {
          setPosition({ x: 0, y: 0 });
          return nextZoom;
        }

        const ratio = nextZoom / prevZoom;
        setPosition(prevPos => ({
          x: mouseX - (mouseX - prevPos.x) * ratio,
          y: mouseY - (mouseY - prevPos.y) * ratio
        }));

        return nextZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isFullscreen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const next = Math.min(prev + 0.5, 6);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 0.5);
      if (next <= 0.9) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag to Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    clickStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const moveX = Math.abs(e.clientX - clickStartRef.current.x);
    const moveY = Math.abs(e.clientY - clickStartRef.current.y);
    const duration = Date.now() - clickStartRef.current.time;

    if (moveX < 6 && moveY < 6 && duration < 250) {
      if (zoomLevel > 1) {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setZoomLevel(2.5);
        const container = viewerContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const clickX = e.clientX - rect.left - rect.width / 2;
          const clickY = e.clientY - rect.top - rect.height / 2;
          setPosition({ x: -clickX * 1.5, y: -clickY * 1.5 });
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Render Overlays Helper
  const renderAnnotations = (isZoomed: boolean = false) => {
    if (!image.annotations || image.annotations.length === 0) return null;

    return (
      <div className="absolute inset-0 z-20 pointer-events-none select-none overflow-hidden">
        {/* Render Vector lines/shapes */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          {image.annotations.map(ann => {
            if (ann.type === 'pen' && ann.points) {
              return (
                <path
                  key={ann.id}
                  d={`M ${ann.points.map(p => `${p.x * 1000} ${p.y * 1000}`).join(' L ')}`}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={ann.size || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            if (ann.type === 'rect') {
              const rx = ann.x * 1000;
              const ry = ann.y * 1000;
              const rw = (ann.width || 0) * 1000;
              const rh = (ann.height || 0) * 1000;
              return (
                <rect
                  key={ann.id}
                  x={rw < 0 ? rx + rw : rx}
                  y={rh < 0 ? ry + rh : ry}
                  width={Math.abs(rw)}
                  height={Math.abs(rh)}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={ann.size || 3}
                />
              );
            }
            if (ann.type === 'circle') {
              const rx = ann.x * 1000;
              const ry = ann.y * 1000;
              const rw = (ann.width || 0) * 1000;
              const rh = (ann.height || 0) * 1000;
              return (
                <circle
                  key={ann.id}
                  cx={rx}
                  cy={ry}
                  r={Math.sqrt(rw * rw + rh * rh)}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={ann.size || 3}
                />
              );
            }
            if (ann.type === 'arrow') {
              const rx = ann.x * 1000;
              const ry = ann.y * 1000;
              const tx = rx + (ann.width || 0) * 1000;
              const ty = ry + (ann.height || 0) * 1000;
              const markerId = `infographic-overlay-head-${isZoomed ? 'zoom' : 'base'}-${ann.id}`;
              return (
                <g key={ann.id}>
                  <defs>
                    <marker
                      id={markerId}
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill={ann.color} />
                    </marker>
                  </defs>
                  <line
                    x1={rx}
                    y1={ry}
                    x2={tx}
                    y2={ty}
                    stroke={ann.color}
                    strokeWidth={ann.size || 3}
                    markerEnd={`url(#${markerId})`}
                  />
                </g>
              );
            }
            return null;
          })}
        </svg>

        {/* Render text labels */}
        {image.annotations.map((ann) => {
          if (ann.type !== 'text') return null;
          return (
            <div
              key={ann.id}
              className="absolute px-1.5 py-0.5 rounded select-none font-display font-semibold text-center shadow-lg border bg-black/80 border-white/10"
              style={{
                left: `${ann.x * 100}%`,
                top: `${ann.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                color: ann.color,
                fontSize: `${Math.max((ann.size || 14) * (isZoomed ? 0.95 : 0.75), 8)}px`
              }}
            >
              <span>{ann.text}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto animate-in fade-in zoom-in duration-700 mt-8">
      
      {/* Image Container with wrapper relative inline */}
      <div className="relative group w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50 flex justify-center items-center">
        {/* Decorative Corner Markers */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-2xl z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-2xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-2xl z-20 pointer-events-none"></div>

        <div className="relative inline-block max-w-full">
          <img 
            src={image.data || undefined} 
            alt={image.prompt} 
            onClick={() => setIsFullscreen(true)}
            className="w-full h-auto object-contain max-h-[80vh] bg-checkered relative z-10 cursor-zoom-in block rounded-xl"
          />
          {renderAnnotations()}
        </div>
        
        {/* Hover Overlay for Quick Actions */}
        <div className="absolute top-6 right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-30">
          <button 
            onClick={onAnnotate}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block"
            title="Annotate overlays, text & shapes"
          >
            <Pencil className="w-5 h-5 text-cyan-400" />
          </button>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block"
            title="Fullscreen View"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <ImageDownloadDropdown
            imageUrl={image.data}
            filenameSlug={`infographic-${image.id}`}
            buttonVariant="glass"
          />
        </div>
      </div>

      {/* Edit Bar - Sitting completely below the image instead of overlapping */}
      <div className="w-full max-w-3xl mt-6 relative z-40 px-4">
        <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl p-3 sm:p-2 sm:pr-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-2 items-center ring-1 ring-black/5 dark:ring-white/5">
            <div className="pl-4 text-cyan-600 dark:text-cyan-400 hidden sm:block">
                <Edit3 className="w-5 h-5" />
            </div>
            <form onSubmit={handleSubmit} className="flex-1 w-full flex flex-col sm:flex-row gap-2 items-end">
                <textarea
                    ref={editInputRef}
                    rows={1}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (editPrompt.trim() && !isEditing) {
                                handleSubmit(e as unknown as React.FormEvent);
                            }
                        }
                    }}
                    placeholder="Refine the visual (e.g., 'Make the background stars')...."
                    className="flex-1 bg-slate-50 dark:bg-slate-950/50 sm:bg-transparent border border-slate-200 dark:border-white/5 sm:border-none rounded-xl sm:rounded-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 px-4 py-2 sm:px-2 sm:py-1.5 font-medium text-base resize-none overflow-y-auto max-h-32 leading-relaxed min-h-[40px]"
                    disabled={isEditing}
                />
                <div className="w-full sm:w-auto" title={!editPrompt.trim() ? "Please enter a prompt to enhance" : "Enhance image"}>
                    <button
                        type="submit"
                        disabled={isEditing || !editPrompt.trim()}
                        className={`w-full sm:w-auto px-5 py-2 sm:py-1.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            isEditing || !editPrompt.trim() 
                            ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                            : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20'
                        }`}
                    >
                        {isEditing ? (
                            <span className="animate-spin w-5 h-5 block border-2 border-white/30 border-t-white rounded-full"></span>
                        ) : (
                            <>
                                <span>Enhance</span>
                                <Sparkles className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2 px-4">
        <p className="text-xs text-slate-500 dark:text-slate-500 font-mono max-w-xl mx-auto truncate opacity-60">
            PROMPT: {image.prompt}
        </p>
      </div>

      {/* Fullscreen Modal with Drag-to-Pan support via React Portals */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
                    <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer" title="Zoom Out">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button onClick={handleResetZoom} className="px-3 py-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center justify-center min-w-[64px] cursor-pointer" title="Reset Zoom">
                        <span className="text-xs font-mono font-bold text-slate-200">{Math.round(zoomLevel * 100)}%</span>
                    </button>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer" title="Zoom In">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>

                <button 
                    onClick={handleCloseFullscreen}
                    className="pointer-events-auto p-3 bg-white/10 backdrop-blur-md text-slate-300 hover:text-white rounded-full hover:bg-white/20 transition-colors shadow-xl border border-white/10 cursor-pointer"
                    title="Close Viewer"
                >
                  <X className="w-6 h-6" />
                </button>
            </div>

            {/* Panning / Zooming Container */}
            <div 
                ref={viewerContainerRef}
                className="flex-1 overflow-hidden flex items-center justify-center p-4 sm:p-8 select-none relative bg-black/20"
                style={{
                    cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'zoom-in')
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div 
                  className="relative origin-center select-none max-w-full max-h-full"
                  style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                    transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <img 
                      src={image.data || undefined} 
                      alt={image.prompt}
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg pointer-events-none select-none"
                  />
                  {renderAnnotations(true)}
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Infographic;