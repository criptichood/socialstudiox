import React, { useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Globe, 
  Bot, 
  Video, 
  Compass, 
  ArrowRight, 
  Layers,
  ImagePlus,
  X 
} from 'lucide-react';
import { useModelOptions } from '@/hooks/useModelOptions';
import { textModelSupportsVision } from '@/types';

interface ResearchInputBarProps {
  inputMessage: string;
  setInputMessage: (val: string) => void;
  isLoading: boolean;
  researchMode: 'grounded' | 'deep';
  setResearchMode: (val: 'grounded' | 'deep') => void;
  selectedModelAlias: string;
  setSelectedModelAlias: (val: string) => void;
  groundingEnabled: boolean;
  setGroundingEnabled: (val: boolean) => void;
  handleSendMessage: (customPrompt?: string) => void;
  samplePrompts: { icon: any; badge: string; title: string; prompt: string }[];
  attachedImages: string[];
  onAddImages: (files: FileList) => void;
  onRemoveImage: (index: number) => void;
}

export const ResearchInputBar: React.FC<ResearchInputBarProps> = ({
  inputMessage,
  setInputMessage,
  isLoading,
  researchMode,
  setResearchMode,
  selectedModelAlias,
  setSelectedModelAlias,
  groundingEnabled,
  setGroundingEnabled,
  handleSendMessage,
  samplePrompts,
  attachedImages,
  onAddImages,
  onRemoveImage,
}) => {
  const { options: modelOptions, loading: modelsLoading } = useModelOptions('text', selectedModelAlias);
  const fallbackOptions = [
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', backend: 'gemini' as const, vision: true },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', backend: 'gemini' as const, vision: true },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', backend: 'gemini' as const, vision: true },
  ];
  const options = modelOptions.length > 0 ? modelOptions : fallbackOptions;
  const selectedSupportsVision = modelOptions.find((o) => o.id === selectedModelAlias)?.vision ?? textModelSupportsVision(selectedModelAlias);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-grow the textarea upward as the user types, capped at a viewport-aware
  // max height (280px / 35% of viewport, whichever is smaller). Once it reaches
  // the cap it becomes internally scrollable instead of expanding forever.
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = Math.min(280, Math.max(120, Math.round((window.innerHeight || 800) * 0.35)));
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputMessage]);

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md space-y-3">
      {/* Model Selector, Mode Toggle & Google Search Grounding Bar */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Model:
          </label>
          <select
            value={selectedModelAlias}
            onChange={(e) => setSelectedModelAlias(e.target.value)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            {modelsLoading && (
              <option value={selectedModelAlias}>Loading models…</option>
            )}
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}{m.backend === 'gateway' ? ' (Gateway)' : ''}{m.vision ? ' (Vision)' : ''}
              </option>
            ))}
          </select>
          {selectedSupportsVision ? (
            <span
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono bg-cyan-100/70 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20"
              title="This model accepts image uploads for analysis"
            >
              <ImagePlus className="w-3 h-3" /> Vision Ready
            </span>
          ) : (
            <span
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
              title="This model does not accept image uploads"
            >
              <ImagePlus className="w-3 h-3" /> No Image Input
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setResearchMode('grounded')}
              className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all cursor-pointer border ${
                researchMode === 'grounded'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              ⚡ Grounded
            </button>
            <button
              type="button"
              onClick={() => setResearchMode('deep')}
              className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all cursor-pointer border ${
                researchMode === 'deep'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              🔬 Deep Research
            </button>
          </div>

          <div
            role="switch"
            aria-checked={groundingEnabled}
            tabIndex={0}
            onClick={() => setGroundingEnabled(!groundingEnabled)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setGroundingEnabled(!groundingEnabled);
              }
            }}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer select-none ${
              groundingEnabled
                ? 'text-cyan-600 dark:text-cyan-400 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20'
                : 'text-slate-400 dark:text-slate-500 border-slate-300/60 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-900/40 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={
              groundingEnabled
                ? 'Google Search grounding is ON — a Gemini 2.5 Flash search tool feeds live results to the selected model'
                : 'Google Search grounding is OFF — chat runs on the selected model only'
            }
          >
            <Globe className={`w-3.5 h-3.5 ${groundingEnabled ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-500'}`} />
            <span>Live Search</span>
            <span
              className={`relative inline-flex items-center h-4 w-7 rounded-full transition-colors ${
                groundingEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${
                  groundingEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Attached image previews */}
      {attachedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedImages.map((src, idx) => (
            <div key={idx} className="relative group">
              <img
                src={src}
                alt={`Attachment ${idx + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 text-white rounded-full shadow-sm hover:bg-rose-600 transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Textarea Input Form */}
      <div className="relative flex items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAddImages(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || !selectedSupportsVision}
          title={
            selectedSupportsVision
              ? 'Attach image(s) for the model to analyze'
              : 'This model does not support image input — pick a vision-capable model first'
          }
          className={`absolute left-3 p-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
            attachedImages.length > 0 || selectedSupportsVision
              ? 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10'
              : 'text-slate-300 dark:text-slate-600'
          }`}
        >
          <ImagePlus className="w-4 h-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={2}
          placeholder={
            selectedSupportsVision
              ? 'Ask anything, paste a URL/topic, or attach an image to analyze (e.g., a competitor ad or a visual draft)...'
              : 'Ask anything or paste a URL/topic (e.g., \'Research viral hooks for SaaS launching next week\')...'
          }
          className="w-full pl-12 pr-14 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-purple-500 rounded-2xl text-xs text-slate-900 dark:text-white outline-none resize-none custom-scrollbar focus:ring-2 focus:ring-purple-500/20"
        />

        <button
          type="button"
          disabled={isLoading || !inputMessage.trim()}
          onClick={() => handleSendMessage()}
          className="absolute right-3 p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-all cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
