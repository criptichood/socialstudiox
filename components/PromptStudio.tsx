/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { SearchResultItem } from '../types';
import { 
  Sliders, 
  Globe, 
  Edit3, 
  Info, 
  Wand2,
  Trash2
} from 'lucide-react';

interface PromptStudioProps {
  draftedPrompt: string;
  setDraftedPrompt: (p: string) => void;
  draftedFacts: string[];
  draftedSearchResults: SearchResultItem[];
  onGenerate: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const PromptStudio: React.FC<PromptStudioProps> = ({
  draftedPrompt,
  setDraftedPrompt,
  draftedFacts,
  draftedSearchResults,
  onGenerate,
  onCancel,
  isLoading,
}) => {
  return (
    <div className="max-w-6xl mx-auto mt-6 animate-in fade-in zoom-in-95 duration-500 relative z-20">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950/80 px-6 py-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-md">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-display text-slate-900 dark:text-white leading-tight">Premium Prompt Design Studio</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review search findings and customize the visual-construction directives before generating the final canvas</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              id="discard-draft-btn"
              onClick={onCancel}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-all border border-slate-200/50 dark:border-white/5 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discard Draft</span>
            </button>
            <button
              id="generate-from-draft-btn"
              onClick={onGenerate}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_15px_rgba(147,51,234,0.3)] flex items-center gap-2"
            >
              <Wand2 className="w-3.5 h-3.5 animate-bounce" />
              <span>Generate Visual Asset</span>
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Grounded Fact Repository */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-2 font-display">
                <Globe className="w-4 h-4 text-cyan-500" />
                Grounded Search Research
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Live search grounding returned these key educational facts, used as foundation rules for labels and design:
              </p>
            </div>

            {/* Facts list */}
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
              {draftedFacts.length > 0 ? (
                draftedFacts.map((fact, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-xl flex gap-3 shadow-sm hover:scale-[1.01] transition-transform">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{fact}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No search facts extracted.</p>
              )}
            </div>

            {/* Search Sources list */}
            {draftedSearchResults.length > 0 && (
              <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 font-display">Verified Sources Consulted:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {draftedSearchResults.map((res, i) => (
                    <a 
                      key={i} 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                    >
                      <Globe className="w-2.5 h-2.5 text-cyan-500" />
                      <span className="max-w-[120px] truncate">{res.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Prompt Sandbox / Editor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2 font-display">
                <Edit3 className="w-4 h-4 text-purple-500" />
                Visual Model Prompt Instructions
              </h3>
              <span className="text-[9px] font-bold text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider border border-purple-200/30 font-display">
                Editable Sandbox
              </span>
            </div>

            <div className="relative group/textarea flex-1 flex flex-col">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl opacity-10 group-focus-within/textarea:opacity-25 transition duration-300 blur-sm pointer-events-none"></div>
              <textarea
                id="drafted-prompt-textarea"
                value={draftedPrompt}
                onChange={(e) => setDraftedPrompt(e.target.value)}
                rows={11}
                className="w-full flex-1 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-950 dark:text-slate-100 placeholder:text-slate-500 text-xs md:text-sm font-medium leading-relaxed outline-none focus:ring-2 focus:ring-purple-500/50 transition-all relative z-10 font-mono"
                placeholder="Modify instruction set here..."
              />
            </div>

            <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-white/5">
              <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                <strong>How to tune:</strong> This contains the high-fidelity style directives compiled for the image generator. You can manually adjust labels, add specific object colors, or specify layouts directly inside this editor.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PromptStudio;
