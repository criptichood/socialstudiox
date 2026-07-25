import React, { useRef } from 'react';
import { 
  Type, Square, Circle, MoveRight, Edit2, Trash2, Save, Undo, X, MousePointer, Check, Info, Sparkles 
} from 'lucide-react';
import { Annotation } from '../../types';

export const PRESET_COLORS = [
  { name: 'Cyan Highlight', value: '#06b6d4' },
  { name: 'Neon Green', value: '#22c55e' },
  { name: 'Warning Orange', value: '#f97316' },
  { name: 'Vibrant Red', value: '#ef4444' },
  { name: 'Gold Yellow', value: '#eab308' },
  { name: 'Paper White', value: '#ffffff' },
  { name: 'Obsidian Black', value: '#0f172a' },
];

interface AnnotationToolbarProps {
  activeTool: 'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'pen';
  setActiveTool: (tool: 'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'pen') => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedAnnotation: Annotation | null;
  onClose: () => void;
  handleUndo: () => void;
  handleClearAll: () => void;
  historyLength: number;
  annotationsLength: number;
  handleDeleteSelected: () => void;
  updateSelectedProperty: (updater: (ann: Annotation) => Annotation) => void;
  onSave: () => void;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  activeTool,
  setActiveTool,
  selectedColor,
  setSelectedColor,
  brushSize,
  setBrushSize,
  selectedId,
  setSelectedId,
  selectedAnnotation,
  onClose,
  handleUndo,
  handleClearAll,
  historyLength,
  annotationsLength,
  handleDeleteSelected,
  updateSelectedProperty,
  onSave,
}) => {
  const textInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full lg:w-80 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 p-5 overflow-y-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="font-bold text-sm uppercase tracking-wider font-display text-slate-100">Annotation Studio</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Exit Studio"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Tips */}
      <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-cyan-200 leading-relaxed font-sans">
          Create professional visuals. Select a tool, click/drag on the infographic to annotate, and adjust text/color parameters.
        </p>
      </div>

      {/* Interactive Tools */}
      <div className="mt-6">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Drawing Toolcase</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'select', label: 'Pointer', icon: MousePointer },
            { id: 'text', label: 'Text Label', icon: Type },
            { id: 'rect', label: 'Rectangle', icon: Square },
            { id: 'circle', label: 'Circle', icon: Circle },
            { id: 'arrow', label: 'Arrow', icon: MoveRight },
            { id: 'pen', label: 'Freehand', icon: Edit2 },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id as any);
                  if (tool.id !== 'select') setSelectedId(null);
                }}
                className={`py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded-xl border font-bold text-[10px] transition-all cursor-pointer ${
                  activeTool === tool.id 
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/15' 
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Design Calibration */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Aesthetic Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => {
                  setSelectedColor(c.value);
                  if (selectedAnnotation) {
                    updateSelectedProperty(ann => ({ ...ann, color: c.value }));
                  }
                }}
                className="w-7 h-7 rounded-full border border-white/20 relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: c.value }}
                title={c.name}
              >
                {(selectedAnnotation ? selectedAnnotation.color === c.value : selectedColor === c.value) && (
                  <Check className={`w-4 h-4 ${c.value === '#ffffff' ? 'text-slate-950' : 'text-white'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between block mb-1.5">
            <span>Weight / Font Size</span>
            <span className="font-mono text-cyan-400 font-bold">{selectedAnnotation?.size || brushSize}px</span>
          </label>
          <input
            type="range"
            min="2"
            max="40"
            value={selectedAnnotation?.size || brushSize}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (selectedAnnotation) {
                updateSelectedProperty(ann => ({ ...ann, size: val }));
              } else {
                setBrushSize(val);
              }
            }}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      {/* Selected element controls */}
      {selectedAnnotation && (
        <div className="mt-6 p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3.5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest font-display">Element Selected</span>
            <button 
              onClick={handleDeleteSelected}
              className="p-1 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors cursor-pointer"
              title="Delete Selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedAnnotation.type === 'text' && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Modify Text</label>
              <input
                ref={textInputRef}
                type="text"
                value={selectedAnnotation.text || ''}
                onChange={(e) => {
                  updateSelectedProperty(ann => ({ ...ann, text: e.target.value }));
                }}
                className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div className="text-[9px] text-slate-500 leading-normal italic font-medium">
            Tip: Drag text labels or shape corners on the image directly to relocate them.
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col gap-2">
        <button
          onClick={handleUndo}
          disabled={historyLength === 0}
          className="w-full py-2 bg-slate-950 hover:bg-slate-900 disabled:opacity-30 border border-slate-850 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Undo className="w-3.5 h-3.5" />
          <span>Undo Step</span>
        </button>
        
        <button
          onClick={handleClearAll}
          disabled={annotationsLength === 0}
          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Annotations</span>
        </button>

        <button
          onClick={onSave}
          className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/15 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Apply & Save layers</span>
        </button>
      </div>
    </div>
  );
};
