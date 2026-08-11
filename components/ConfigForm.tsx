/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState } from 'react';
import { ComplexityLevel, VisualStyle, Language, AspectRatio, DraftPrompt, ImageModelId } from '../types';
import { STYLE_GUIDES } from '../services/stylesGuide';
import { 
  CustomDropdown, 
  ComplexityDropdown, 
  StyleDropdown, 
  LanguageDropdown,
  ImageModelDropdown
} from './CustomDropdown';
import { 
  Search, 
  GraduationCap, 
  Palette, 
  Globe, 
  SlidersHorizontal, 
  Microscope, 
  Sparkles,
  Smartphone,
  Monitor,
  Square,
  ChevronDown,
  Upload,
  Trash2,
  Image as ImageIcon,
  HelpCircle,
  FolderOpen,
  X,
  Play,
  Calendar,
  Layout,
  Layers
} from 'lucide-react';

interface ConfigFormProps {
  topic: string;
  setTopic: (t: string) => void;
  complexityLevel: ComplexityLevel;
  setComplexityLevel: (c: ComplexityLevel) => void;
  visualStyle: VisualStyle;
  setVisualStyle: (v: VisualStyle) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  resolution: AspectRatio;
  setResolution: (r: AspectRatio) => void;
  imageModel?: ImageModelId;
  setImageModel?: (m: ImageModelId) => void;
  subOptions: Record<string, string>;
  setSubOptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: (e: React.FormEvent) => void;
  onDraft: () => void;
  isLoading: boolean;
  referenceImage: string | null;
  setReferenceImage: (img: string | null) => void;
  referenceMode: 'layout' | 'background' | 'style';
  setReferenceMode: (mode: 'layout' | 'background' | 'style') => void;
  lastGeneratedImage: string | null;
  drafts?: DraftPrompt[];
  onLaunchDraft?: (draft: DraftPrompt) => void;
  onDeleteDraft?: (id: string) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  topic,
  setTopic,
  complexityLevel,
  setComplexityLevel,
  visualStyle,
  setVisualStyle,
  language,
  setLanguage,
  resolution,
  setResolution,
  imageModel = 'gemini-3.1-flash-image',
  setImageModel = () => {},
  subOptions,
  setSubOptions,
  onSubmit,
  onDraft,
  isLoading,
  referenceImage,
  setReferenceImage,
  referenceMode,
  setReferenceMode,
  lastGeneratedImage,
  drafts = [],
  onLaunchDraft,
  onDeleteDraft,
}) => {

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [modalFilter, setModalFilter] = useState<'all' | 'campaign' | 'canvas'>('all');

  const filteredDrafts = (drafts || []).filter(d => {
    if (!d) return false;
    if (modalFilter === 'campaign') return d.sourceType === 'campaign';
    if (modalFilter === 'canvas') return d.sourceType === 'visual-canvas' || d.sourceType === 'manual' || !d.sourceType;
    return true;
  });

  // Auto-grow textarea up to ~5-6 sentences (max height ~130px) before becoming scrollable
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const clamped = Math.min(scrollH, 130);
      textareaRef.current.style.height = `${clamped}px`;
    }
  }, [topic]);

  // Auto-set default sub-options when style changes
  useEffect(() => {
    const guide = STYLE_GUIDES[visualStyle];
    if (guide && guide.options.length > 0) {
      const initial: Record<string, string> = {};
      guide.options.forEach(opt => {
        initial[opt.id] = opt.choices[0].value;
      });
      setSubOptions(initial);
    } else {
      setSubOptions({});
    }
  }, [visualStyle, setSubOptions]);

  return (
    <div className={`relative z-20 transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none scale-95 blur-sm' : 'scale-100'}`}>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 rounded-3xl opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500 blur-xl"></div>
        
        <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 md:p-6 rounded-3xl shadow-2xl">
            
            {/* Parameters Grid - Vertically stacked on desktop for sidebar layout compatibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            
              {/* Audience Complexity Level Selector */}
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display block px-1">Level</label>
                  <ComplexityDropdown 
                      value={complexityLevel} 
                      onChange={(val) => setComplexityLevel(val)} 
                  />
              </div>

              {/* Visual Style Aesthetic Selector */}
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display block px-1">Style</label>
                  <StyleDropdown 
                      value={visualStyle} 
                      onChange={(val) => setVisualStyle(val)} 
                  />
              </div>

               {/* Target Language Selector */}
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display block px-1">Language</label>
                  <LanguageDropdown 
                      value={language} 
                      onChange={(val) => setLanguage(val)} 
                  />
              </div>

              {/* Aspect Resolution Selector with Custom Dropdown */}
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display block px-1">Aspect Resolution</label>
                  <CustomDropdown 
                      value={resolution} 
                      onChange={(val) => setResolution(val)} 
                  />
              </div>

              {/* Image Model Selector */}
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display block px-1">Image Model</label>
                  <ImageModelDropdown 
                      value={imageModel} 
                      onChange={(val) => setImageModel(val)} 
                  />
              </div>

            </div>

            {/* COLLAPSIBLE REFERENCE IMAGE ENGINE */}
            <div className="mt-4 p-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4 text-cyan-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest font-display">Reference Image Engine</h4>
                </div>
              </div>

              {/* Upload Dropzone / Thumbnail display */}
              {!referenceImage ? (
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-colors bg-white/50 dark:bg-slate-900/40 relative group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setReferenceImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setReferenceImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Click or drag reference image here
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                    Supports PNG, JPG, JPEG
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 bg-slate-950 aspect-[4/3] flex items-center justify-center">
                    <img 
                      src={referenceImage || undefined} 
                      alt="Reference visual context" 
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setReferenceImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                      title="Clear Reference Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Mode select and instruction tips */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display block">Reference Blend Mode</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setReferenceMode('layout')}
                        className={`py-1.5 px-1 text-[9px] font-bold rounded-lg transition-all text-center ${
                          referenceMode === 'layout'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title="Composition template"
                      >
                        Layout
                      </button>
                      <button
                        type="button"
                        onClick={() => setReferenceMode('background')}
                        className={`py-1.5 px-1 text-[9px] font-bold rounded-lg transition-all text-center ${
                          referenceMode === 'background'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title="Keep foreground subject, swap background"
                      >
                        BG Swap
                      </button>
                      <button
                        type="button"
                        onClick={() => setReferenceMode('style')}
                        className={`py-1.5 px-1 text-[9px] font-bold rounded-lg transition-all text-center ${
                          referenceMode === 'style'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title="Adopt color palette and artistic theme"
                      >
                        Style
                      </button>
                    </div>

                    <p className="text-[9px] leading-relaxed text-slate-500 dark:text-slate-400 italic">
                      {referenceMode === 'layout' && "✓ Composition Guide: Overlaying new annotations over the source's structure."}
                      {referenceMode === 'background' && "✓ BG Swap: Extract foreground elements and render a beautiful custom environment background."}
                      {referenceMode === 'style' && "✓ Style Transfusion: Inject the color tones and visual textures into a fresh design."}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Action: Use Last generated infographic as reference */}
              {lastGeneratedImage && referenceImage !== lastGeneratedImage && (
                <button
                  type="button"
                  onClick={() => setReferenceImage(lastGeneratedImage)}
                  className="w-full mt-2.5 py-1.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold rounded-xl border border-cyan-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 animate-pulse" />
                  <span>Load active sandbox graphic</span>
                </button>
              )}
            </div>

            {/* Custom Aesthetic Fine-Tuning Calibration Panels */}
            {visualStyle !== 'Default' && STYLE_GUIDES[visualStyle]?.options.length > 0 && (
              <div className="mt-4 p-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2.5 mb-3">
                  <SlidersHorizontal className="w-4 h-4 text-purple-500 animate-bounce" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest font-display">Aesthetic Calibration Deck</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {STYLE_GUIDES[visualStyle].options.map(opt => (
                    <div key={opt.id} className="flex flex-col gap-1 bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display">{opt.label}</label>
                      <div className="relative">
                        <select
                          id={`style-suboption-${opt.id}`}
                          value={subOptions[opt.id] || ''}
                          onChange={(e) => setSubOptions(prev => ({ ...prev, [opt.id]: e.target.value }))}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-0 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {opt.choices.map(choice => (
                            <option key={choice.value} value={choice.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{choice.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INPUT FIELD & ACTIONS SECTION */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-display">
                Infographic Topic / Creative Request
              </label>
              
              <div className="relative flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-white/5 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                <div className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  <textarea
                    id="topic-search-input"
                    ref={textareaRef}
                    rows={2}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g., Photosynthesis mechanics, Quantum computing qubits..."
                    className="w-full bg-transparent border-none outline-none text-xs md:text-sm placeholder:text-slate-400 font-medium text-slate-900 dark:text-white resize-none max-h-[130px] overflow-y-auto leading-relaxed focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col gap-2 w-full pt-1">
                <div className="flex gap-2 w-full">
                  <button
                    id="instant-generate-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSubmit(e);
                    }}
                    disabled={isLoading || !topic.trim()}
                    className="flex-grow h-10 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold font-display text-[11px] uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(6,182,212,0.15)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Directly trigger AI Research and Image Generation"
                  >
                    <Microscope className="w-3.5 h-3.5 animate-pulse" />
                    <span>Generate</span>
                  </button>

                  <div className="relative group/tooltip">
                    <button
                      id="draft-custom-tuning-btn"
                      type="button"
                      onClick={onDraft}
                      disabled={isLoading || !topic.trim()}
                      className="px-4 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold font-display text-[11px] uppercase tracking-wider transition-all border border-slate-200 dark:border-white/5 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>Save Draft</span>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-slate-900 text-white text-[9px] p-2 rounded-lg shadow-lg w-48 border border-white/10 z-50 pointer-events-none">
                      Save this prompt configuration to your persistent drafts vault.
                    </div>
                  </div>
                </div>

                {/* Browse Saved Drafts button */}
                <button
                  type="button"
                  onClick={() => setShowDraftsModal(true)}
                  className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 rounded-xl font-bold font-display text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <FolderOpen className="w-4 h-4 text-purple-500" />
                  <span>Browse Drafts Vault</span>
                  {drafts.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-purple-600 text-white text-[9px] font-bold rounded-full">
                      {drafts.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

        </div>
      </div>

      {/* DRAFTS BROWSER POPUP MODAL */}
      {showDraftsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-300 text-left max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Saved Drafts Vault</h3>
                  <p className="text-xs text-slate-400">Select any saved draft to load directly into the Visual Studio input field.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Category Filters */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setModalFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modalFilter === 'all' 
                    ? 'bg-purple-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({drafts.length})
              </button>
              <button
                type="button"
                onClick={() => setModalFilter('campaign')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modalFilter === 'campaign' 
                    ? 'bg-purple-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Campaigns ({drafts.filter(d => d.sourceType === 'campaign').length})
              </button>
              <button
                type="button"
                onClick={() => setModalFilter('canvas')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modalFilter === 'canvas' 
                    ? 'bg-purple-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Canvas / Manual ({drafts.filter(d => d.sourceType === 'visual-canvas' || d.sourceType === 'manual' || !d.sourceType).length})
              </button>
            </div>

            {/* List of Drafts */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {filteredDrafts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-xs font-medium">No saved drafts found in this category.</p>
                </div>
              ) : (
                filteredDrafts.map((draft) => (
                  <div 
                    key={draft.id} 
                    className="p-4 bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 rounded-2xl transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {draft.sourceType === 'campaign' ? (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{draft.sourceCampaignName ? `Campaign: ${draft.sourceCampaignName}` : 'Social Campaign'}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                              <Layout className="w-2.5 h-2.5" />
                              <span>Image Generator</span>
                            </span>
                          )}

                          {draft.slideNumber && (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-bold rounded-md">
                              Slide #{draft.slideNumber}
                            </span>
                          )}

                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold uppercase rounded-md">
                            {draft.resolution}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          {draft.topic}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {onDeleteDraft && (
                          <button
                            type="button"
                            onClick={() => onDeleteDraft(draft.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (draft.visualPrompt) {
                              setTopic(draft.visualPrompt);
                            } else {
                              setTopic(draft.topic);
                            }
                            if (draft.visualStyle) setVisualStyle(draft.visualStyle);
                            if (draft.resolution) setResolution(draft.resolution);
                            if (draft.complexityLevel) setComplexityLevel(draft.complexityLevel);
                            if (draft.language) setLanguage(draft.language);
                            if (onLaunchDraft) onLaunchDraft(draft);
                            setShowDraftsModal(false);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Load Draft</span>
                        </button>
                      </div>
                    </div>

                    {/* Blueprint Visual Prompt text snippet */}
                    {draft.visualPrompt && (
                      <p className="text-[11px] text-slate-400 italic font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                        {draft.visualPrompt}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 shrink-0">
              <span>{filteredDrafts.length} drafts in view</span>
              <button
                type="button"
                onClick={() => setShowDraftsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigForm;
