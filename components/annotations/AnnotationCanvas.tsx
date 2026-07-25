import React, { useRef, useState, useEffect } from 'react';
import { Annotation, GeneratedImage } from '../../types';

interface AnnotationCanvasProps {
  image: GeneratedImage;
  activeTool: 'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'pen';
  selectedColor: string;
  brushSize: number;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  saveToHistory: (newAnnotations: Annotation[]) => void;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  image,
  activeTool,
  selectedColor,
  brushSize,
  selectedId,
  setSelectedId,
  annotations,
  setAnnotations,
  saveToHistory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [tempAnnotation, setTempAnnotation] = useState<Annotation | null>(null);

  // Dragging annotations states (unified shapes + text labels)
  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedAnn, setDraggedAnn] = useState<Annotation | null>(null);
  const [dragStartPoints, setDragStartPoints] = useState<{ x: number; y: number }[]>([]);

  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rx = (clientX - rect.left) / rect.width;
    const ry = (clientY - rect.top) / rect.height;
    
    // Clamp between 0 and 1
    return {
      x: Math.min(Math.max(rx, 0), 1),
      y: Math.min(Math.max(ry, 0), 1)
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const coords = getRelativeCoords(e);
    
    if (activeTool === 'select') {
      // If clicking the empty canvas itself, clear selection
      if (e.target === e.currentTarget) {
        setSelectedId(null);
      }
      return;
    }

    setIsDrawing(true);
    setStartPos(coords);

    if (activeTool === 'pen') {
      setCurrentPoints([coords]);
    } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow') {
      const newAnn: Annotation = {
        id: 'temp',
        type: activeTool,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        color: selectedColor,
        size: brushSize
      };
      setTempAnnotation(newAnn);
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const coords = getRelativeCoords(e);

    if (activeTool === 'pen') {
      setCurrentPoints(prev => [...prev, coords]);
    } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow') {
      if (!tempAnnotation) return;
      
      const width = coords.x - startPos.x;
      const height = coords.y - startPos.y;
      
      setTempAnnotation({
        ...tempAnnotation,
        width,
        height
      });
    }
  };

  const handleEnd = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const coords = getRelativeCoords(e);
    const id = 'ann-' + Date.now();

    if (activeTool === 'pen') {
      if (currentPoints.length > 2) {
        const newAnn: Annotation = {
          id,
          type: 'pen',
          x: currentPoints[0].x,
          y: currentPoints[0].y,
          points: currentPoints,
          color: selectedColor,
          size: brushSize
        };
        saveToHistory([...annotations, newAnn]);
        setSelectedId(id);
      }
      setCurrentPoints([]);
    } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow') {
      if (!tempAnnotation) return;
      
      const finalWidth = coords.x - startPos.x;
      const finalHeight = coords.y - startPos.y;

      // Ignore accidental micro clicks
      if (Math.abs(finalWidth) > 0.005 || Math.abs(finalHeight) > 0.005) {
        const newAnn: Annotation = {
          ...tempAnnotation,
          id,
          width: finalWidth,
          height: finalHeight
        };
        saveToHistory([...annotations, newAnn]);
        setSelectedId(id);
      }
      setTempAnnotation(null);
    } else if (activeTool === 'text') {
      const newAnn: Annotation = {
        id,
        type: 'text',
        x: coords.x,
        y: coords.y,
        text: 'New Label',
        color: selectedColor,
        size: 14
      };
      saveToHistory([...annotations, newAnn]);
      setSelectedId(id);
    }
  };

  const handleAnnotationDragStart = (e: React.MouseEvent | React.TouchEvent, ann: Annotation) => {
    e.stopPropagation();
    setSelectedId(ann.id);
    setIsDraggingAnnotation(true);
    setDraggedAnn(ann);
    if (ann.points) {
      setDragStartPoints([...ann.points]);
    } else {
      setDragStartPoints([]);
    }
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const annPxX = ann.x * rect.width;
    const annPxY = ann.y * rect.height;
    
    const offsetPxX = (clientX - rect.left) - annPxX;
    const offsetPxY = (clientY - rect.top) - annPxY;
    
    setDragOffset({ x: offsetPxX, y: offsetPxY });
  };

  const handleAnnotationDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingAnnotation || !selectedId || !draggedAnn) return;
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const clickPxX = clientX - rect.left;
    const clickPxY = clientY - rect.top;
    
    const rx = (clickPxX - dragOffset.x) / rect.width;
    const ry = (clickPxY - dragOffset.y) / rect.height;
    
    const clampedRx = Math.min(Math.max(rx, 0), 1);
    const clampedRy = Math.min(Math.max(ry, 0), 1);
    
    const dx = clampedRx - draggedAnn.x;
    const dy = clampedRy - draggedAnn.y;
    
    setAnnotations(prev => prev.map(ann => {
      if (ann.id === selectedId) {
        if (ann.type === 'pen' && dragStartPoints.length > 0) {
          return {
            ...ann,
            x: clampedRx,
            y: clampedRy,
            points: dragStartPoints.map(p => ({
              x: Math.min(Math.max(p.x + dx, 0), 1),
              y: Math.min(Math.max(p.y + dy, 0), 1)
            }))
          };
        } else {
          return {
            ...ann,
            x: clampedRx,
            y: clampedRy
          };
        }
      }
      return ann;
    }));
  };

  const handleAnnotationDragEnd = () => {
    if (isDraggingAnnotation) {
      setIsDraggingAnnotation(false);
      setDraggedAnn(null);
      setDragStartPoints([]);
    }
  };

  useEffect(() => {
    if (isDraggingAnnotation) {
      window.addEventListener('mousemove', handleAnnotationDragMove);
      window.addEventListener('mouseup', handleAnnotationDragEnd);
      window.addEventListener('touchmove', handleAnnotationDragMove, { passive: false });
      window.addEventListener('touchend', handleAnnotationDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleAnnotationDragMove);
        window.removeEventListener('mouseup', handleAnnotationDragEnd);
        window.removeEventListener('touchmove', handleAnnotationDragMove);
        window.removeEventListener('touchend', handleAnnotationDragEnd);
      };
    }
  }, [isDraggingAnnotation, selectedId, dragOffset, draggedAnn, dragStartPoints]);

  const selectedAnnotation = annotations.find(ann => ann.id === selectedId);

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 overflow-auto bg-slate-955 relative">
      <div className="absolute top-4 left-4 text-[10px] text-slate-500 font-mono">
        CANVAS SPACE ({image.resolution})
      </div>

      <div 
        ref={containerRef}
        className="relative inline-block select-none max-w-full"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{
          cursor: activeTool === 'select' ? 'default' : 'crosshair'
        }}
      >
        <img 
          src={image.data} 
          alt="Infographic Visual Base" 
          className="max-h-[75vh] md:max-h-[80vh] w-auto max-w-full block select-none pointer-events-none rounded-lg"
        />

        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          {annotations.map((ann) => {
            if (ann.id === selectedId) return null;

            if (ann.type === 'pen' && ann.points) {
              return (
                <path
                  key={ann.id}
                  d={`M ${ann.points.map(p => `${p.x * 1000} ${p.y * 1000}`).join(' L ')}`}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={(ann.size || brushSize) + (activeTool === 'select' ? 10 : 0)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={activeTool === 'select' ? 'pointer-events-auto cursor-move hover:stroke-cyan-400 transition-colors' : ''}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
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
                  fill="rgba(255, 255, 255, 0.01)"
                  stroke={ann.color}
                  strokeWidth={ann.size || 3}
                  className={activeTool === 'select' ? 'pointer-events-auto cursor-move hover:stroke-cyan-400 hover:fill-cyan-500/10 transition-all' : ''}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
                />
              );
            }

            if (ann.type === 'circle') {
              const rx = ann.x * 1000;
              const ry = ann.y * 1000;
              const rw = (ann.width || 0) * 1000;
              const rh = (ann.height || 0) * 1000;
              const radius = Math.sqrt(rw * rw + rh * rh);
              return (
                <circle
                  key={ann.id}
                  cx={rx}
                  cy={ry}
                  r={radius}
                  fill="rgba(255, 255, 255, 0.01)"
                  stroke={ann.color}
                  strokeWidth={ann.size || 3}
                  className={activeTool === 'select' ? 'pointer-events-auto cursor-move hover:stroke-cyan-400 hover:fill-cyan-500/10 transition-all' : ''}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
                />
              );
            }

            if (ann.type === 'arrow') {
              const rx = ann.x * 1000;
              const ry = ann.y * 1000;
              const tx = rx + (ann.width || 0) * 1000;
              const ty = ry + (ann.height || 0) * 1000;
              const markerId = `arrowhead-${ann.id}`;
              return (
                <g 
                  key={ann.id}
                  className={activeTool === 'select' ? 'pointer-events-auto cursor-move group' : ''}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      handleAnnotationDragStart(e, ann);
                    }
                  }}
                >
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
                    stroke="transparent"
                    strokeWidth={20}
                  />
                  <line
                    x1={rx}
                    y1={ry}
                    x2={tx}
                    y2={ty}
                    stroke={ann.color}
                    strokeWidth={ann.size || 3}
                    markerEnd={`url(#${markerId})`}
                    className="group-hover:stroke-cyan-400 transition-colors"
                  />
                </g>
              );
            }

            return null;
          })}

          {tempAnnotation && (
            <>
              {tempAnnotation.type === 'rect' && (
                <rect
                  x={tempAnnotation.width! < 0 ? (tempAnnotation.x + tempAnnotation.width!) * 1000 : tempAnnotation.x * 1000}
                  y={tempAnnotation.height! < 0 ? (tempAnnotation.y + tempAnnotation.height!) * 1000 : tempAnnotation.y * 1000}
                  width={Math.abs(tempAnnotation.width!) * 1000}
                  height={Math.abs(tempAnnotation.height!) * 1000}
                  fill="none"
                  stroke={tempAnnotation.color}
                  strokeWidth={tempAnnotation.size}
                  strokeDasharray="4,4"
                />
              )}
              {tempAnnotation.type === 'circle' && (
                <circle
                  cx={tempAnnotation.x * 1000}
                  cy={tempAnnotation.y * 1000}
                  r={Math.sqrt(Math.pow(tempAnnotation.width! * 1000, 2) + Math.pow(tempAnnotation.height! * 1000, 2))}
                  fill="none"
                  stroke={tempAnnotation.color}
                  strokeWidth={tempAnnotation.size}
                  strokeDasharray="4,4"
                />
              )}
              {tempAnnotation.type === 'arrow' && (
                <line
                  x1={tempAnnotation.x * 1000}
                  y1={tempAnnotation.y * 1005}
                  x2={(tempAnnotation.x + tempAnnotation.width!) * 1000}
                  y2={(tempAnnotation.y + tempAnnotation.height!) * 1000}
                  stroke={tempAnnotation.color}
                  strokeWidth={tempAnnotation.size}
                  strokeDasharray="4,4"
                />
              )}
            </>
          )}

          {activeTool === 'pen' && isDrawing && currentPoints.length > 1 && (
            <path
              d={`M ${currentPoints.map(p => `${p.x * 1000} ${p.y * 1000}`).join(' L ')}`}
              fill="none"
              stroke={selectedColor}
              strokeWidth={brushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {selectedAnnotation && (
            <>
              {selectedAnnotation.type === 'pen' && selectedAnnotation.points && (
                <path
                  d={`M ${selectedAnnotation.points.map(p => `${p.x * 1000} ${p.y * 1000}`).join(' L ')}`}
                  fill="none"
                  stroke={selectedAnnotation.color}
                  strokeWidth={(selectedAnnotation.size || brushSize) + 10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-auto cursor-move stroke-cyan-400"
                  onMouseDown={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                  onTouchStart={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                />
              )}
              {selectedAnnotation.type === 'rect' && (
                <rect
                  x={selectedAnnotation.width! < 0 ? (selectedAnnotation.x + selectedAnnotation.width!) * 1000 : selectedAnnotation.x * 1000}
                  y={selectedAnnotation.height! < 0 ? (selectedAnnotation.y + selectedAnnotation.height!) * 1000 : selectedAnnotation.y * 1000}
                  width={Math.abs(selectedAnnotation.width!) * 1000}
                  height={Math.abs(selectedAnnotation.height!) * 1000}
                  fill="rgba(6, 182, 212, 0.15)"
                  stroke={selectedAnnotation.color}
                  strokeWidth={(selectedAnnotation.size || 3) + 2}
                  className="pointer-events-auto cursor-move animate-pulse stroke-cyan-400"
                  onMouseDown={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                  onTouchStart={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                />
              )}
              {selectedAnnotation.type === 'circle' && (
                <circle
                  cx={selectedAnnotation.x * 1000}
                  cy={selectedAnnotation.y * 1000}
                  r={Math.sqrt(Math.pow(selectedAnnotation.width! * 1000, 2) + Math.pow(selectedAnnotation.height! * 1000, 2))}
                  fill="rgba(6, 182, 212, 0.15)"
                  stroke={selectedAnnotation.color}
                  strokeWidth={(selectedAnnotation.size || 3) + 2}
                  className="pointer-events-auto cursor-move animate-pulse stroke-cyan-400"
                  onMouseDown={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                  onTouchStart={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                />
              )}
              {selectedAnnotation.type === 'arrow' && (
                <g 
                  className="pointer-events-auto cursor-move"
                  onMouseDown={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                  onTouchStart={(e) => handleAnnotationDragStart(e, selectedAnnotation)}
                >
                  <defs>
                    <marker
                      id={`selected-arrowhead-${selectedAnnotation.id}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill="#00ffff" />
                    </marker>
                  </defs>
                  <line
                    x1={selectedAnnotation.x * 1000}
                    y1={selectedAnnotation.y * 1000}
                    x2={(selectedAnnotation.x + selectedAnnotation.width!) * 1000}
                    y2={(selectedAnnotation.y + selectedAnnotation.height!) * 1000}
                    stroke="transparent"
                    strokeWidth={20}
                  />
                  <line
                    x1={selectedAnnotation.x * 1000}
                    y1={selectedAnnotation.y * 1000}
                    x2={(selectedAnnotation.x + selectedAnnotation.width!) * 1000}
                    y2={(selectedAnnotation.y + selectedAnnotation.height!) * 1000}
                    stroke="#00ffff"
                    strokeWidth={(selectedAnnotation.size || 3) + 2}
                    markerEnd={`url(#selected-arrowhead-${selectedAnnotation.id})`}
                  />
                  <circle cx={selectedAnnotation.x * 1000} cy={selectedAnnotation.y * 1000} r="8" fill="#00ffff" />
                  <circle cx={(selectedAnnotation.x + selectedAnnotation.width!) * 1000} cy={(selectedAnnotation.y + selectedAnnotation.height!) * 1000} r="8" fill="#00ffff" />
                </g>
              )}
            </>
          )}
        </svg>

        <div className="absolute inset-0 z-25 pointer-events-none">
          {annotations.map((ann) => {
            if (ann.type !== 'text') return null;
            
            const isSelected = ann.id === selectedId;

            return (
              <div
                key={ann.id}
                onMouseDown={(e) => {
                  if (activeTool === 'select') handleAnnotationDragStart(e, ann);
                }}
                onTouchStart={(e) => {
                  if (activeTool === 'select') handleAnnotationDragStart(e, ann);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(ann.id);
                }}
                className={`absolute pointer-events-auto px-2 py-1 rounded select-none cursor-move transition-shadow flex items-center gap-1 text-center font-display font-semibold select-none shadow-md ${
                  isSelected 
                    ? 'ring-2 ring-cyan-400 scale-105 z-40 bg-slate-900 border border-cyan-400' 
                    : 'bg-black/75 hover:bg-black/90 border border-white/10'
                }`}
                style={{
                  left: `${ann.x * 100}%`,
                  top: `${ann.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  color: ann.color,
                  fontSize: `${ann.size || 14}px`
                }}
              >
                <span>{ann.text || 'Text'}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
