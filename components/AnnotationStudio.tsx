import React, { useState } from 'react';
import { Annotation, GeneratedImage } from '../types';
import { AnnotationToolbar } from './annotations/AnnotationToolbar';
import { AnnotationCanvas } from './annotations/AnnotationCanvas';

interface AnnotationStudioProps {
  image: GeneratedImage;
  onSave: (annotations: Annotation[]) => void;
  onClose: () => void;
}

export const AnnotationStudio: React.FC<AnnotationStudioProps> = ({ image, onSave, onClose }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>(image.annotations || []);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'pen'>('select');
  const [selectedColor, setSelectedColor] = useState('#06b6d4');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Undo history
  const [history, setHistory] = useState<Annotation[][]>([]);

  // Save state to undo history
  const saveToHistory = (newAnnotations: Annotation[]) => {
    setHistory(prev => [...prev, annotations]);
    setAnnotations(newAnnotations);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setAnnotations(prev);
    setSelectedId(null);
  };

  const handleClearAll = () => {
    if (confirm('Clear all annotations on this infographic?')) {
      saveToHistory([]);
      setSelectedId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    saveToHistory(annotations.filter(ann => ann.id !== selectedId));
    setSelectedId(null);
  };

  const updateSelectedProperty = (updater: (ann: Annotation) => Annotation) => {
    if (!selectedId) return;
    saveToHistory(annotations.map(ann => ann.id === selectedId ? updater(ann) : ann));
  };

  const selectedAnnotation = annotations.find(ann => ann.id === selectedId);

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/98 backdrop-blur-xl flex flex-col lg:flex-row text-white animate-in fade-in duration-300">
      
      {/* 1. LEFT: Control Panel Toolbar */}
      <AnnotationToolbar 
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        selectedAnnotation={selectedAnnotation || null}
        onClose={onClose}
        handleUndo={handleUndo}
        handleClearAll={handleClearAll}
        historyLength={history.length}
        annotationsLength={annotations.length}
        handleDeleteSelected={handleDeleteSelected}
        updateSelectedProperty={updateSelectedProperty}
        onSave={() => {
          onSave(annotations);
          onClose();
        }}
      />

      {/* 2. CENTER & RIGHT: Main interactive vector mockup canvas */}
      <AnnotationCanvas 
        image={image}
        activeTool={activeTool}
        selectedColor={selectedColor}
        brushSize={brushSize}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        annotations={annotations}
        setAnnotations={setAnnotations}
        saveToHistory={saveToHistory}
      />

    </div>
  );
};
export default AnnotationStudio;
