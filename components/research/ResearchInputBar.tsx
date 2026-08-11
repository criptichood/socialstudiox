import React from 'react';
import { 
  Send, 
  Loader2, 
  Globe, 
  Bot, 
  Video, 
  Compass, 
  ArrowRight, 
  Layers 
} from 'lucide-react';

interface ResearchInputBarProps {
  inputMessage: string;
  setInputMessage: (val: string) => void;
  isLoading: boolean;
  researchMode: 'grounded' | 'deep';
  setResearchMode: (val: 'grounded' | 'deep') => void;
  selectedModelAlias: string;
  setSelectedModelAlias: (val: string) => void;
  handleSendMessage: (customPrompt?: string) => void;
  samplePrompts: { icon: any; badge: string; title: string; prompt: string }[];
}

export const ResearchInputBar: React.FC<ResearchInputBarProps> = ({
  inputMessage,
  setInputMessage,
  isLoading,
  researchMode,
  setResearchMode,
  selectedModelAlias,
  setSelectedModelAlias,
  handleSendMessage,
  samplePrompts,
}) => {
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
            <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast Strategy)</option>
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra-Fast)</option>
          </select>
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

          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 bg-cyan-500/10"
            title="Research always answers with up-to-date Google Search grounding"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            <span>Live Search Grounded</span>
          </span>
        </div>
      </div>

      {/* Main Textarea Input Form */}
      <div className="relative flex items-center">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={2}
          placeholder="Ask anything or paste a URL/topic (e.g., 'Research viral hooks for SaaS launching next week')..."
          className="w-full pl-4 pr-14 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-purple-500 rounded-2xl text-xs text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-purple-500/20"
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
