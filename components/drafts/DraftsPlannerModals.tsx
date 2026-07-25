import React, { useState, useEffect } from 'react';
import { X, Globe, Plus, Sparkles, Folder, ArrowRight, Layers } from 'lucide-react';
import { ComplexityLevel, VisualStyle, Language, AspectRatio } from '../../types';
import { AspectRatioIcon, getAspectLabel } from './AspectBadge';


interface BlueprintModalProps {
  show: boolean;
  onClose: () => void;
  topic: string;
  setTopic: (t: string) => void;
  style: VisualStyle;
  setStyle: (s: VisualStyle) => void;
  level: ComplexityLevel;
  setLevel: (l: ComplexityLevel) => void;
  resolution: AspectRatio;
  setResolution: (r: AspectRatio) => void;
  lang: Language;
  setLang: (la: Language) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateBlueprintModal: React.FC<BlueprintModalProps> = ({
  show,
  onClose,
  topic,
  setTopic,
  style,
  setStyle,
  level,
  setLevel,
  resolution,
  setResolution,
  lang,
  setLang,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Create Content Draft</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure visual layout, complexity, and styling targets before generation.</p>
        
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Research Topic</label>
            <input
              type="text"
              required
              placeholder="e.g. Structure of the Earth's Crust"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Visual Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as VisualStyle)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer"
              >
                {['Default', 'Minimalist', 'Realistic', 'Cartoon', 'Vintage', 'Futuristic', '3D Render', 'Sketch', 'Carousel'].map(s => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Complexity</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ComplexityLevel)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer"
              >
                {['Default', 'Elementary', 'High School', 'College', 'Expert'].map(l => (
                  <option key={l} value={l} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as AspectRatio)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer"
              >
                {['16:9', '9:16', '1:1'].map(r => (
                  <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer"
              >
                {['Default', 'English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Hindi', 'Arabic', 'Portuguese', 'Russian'].map(la => (
                  <option key={la} value={la} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{la}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              Save Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CampaignModalProps {
  show: boolean;
  onClose: () => void;
  name: string;
  setName: (n: string) => void;
  website: string;
  setWebsite: (w: string) => void;
  topic: string;
  setTopic: (t: string) => void;
  platform: string;
  setPlatform: (p: string) => void;
  postCount: number;
  setPostCount: (c: number) => void;
  styleGuide: string;
  setStyleGuide: (g: string) => void;
  startMethod: 'ai' | 'empty';
  setStartMethod: (m: 'ai' | 'empty') => void;
  templateName: string;
  setTemplateName: (t: string) => void;
  preferredAspect?: AspectRatio;
  setPreferredAspect?: (a: AspectRatio) => void;
  preferredStyle?: VisualStyle;
  setPreferredStyle?: (s: VisualStyle) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateCampaignModal: React.FC<CampaignModalProps> = ({
  show,
  onClose,
  name,
  setName,
  website,
  setWebsite,
  topic,
  setTopic,
  platform,
  setPlatform,
  postCount,
  setPostCount,
  styleGuide,
  setStyleGuide,
  startMethod,
  setStartMethod,
  templateName,
  setTemplateName,
  preferredAspect = '9:16',
  setPreferredAspect,
  preferredStyle = 'Default',
  setPreferredStyle,
  onSubmit,
}) => {
  const [modalStep, setModalStep] = useState<'method' | 'details'>('method');

  // Reset the onboarding step to start on reopen
  useEffect(() => {
    if (show) {
      setModalStep('method');
    }
  }, [show]);

  if (!show) return null;

  const handleSelectMethod = (method: 'ai' | 'empty') => {
    setStartMethod(method);
    setModalStep('details');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative transition-all duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            {modalStep === 'method' ? 'Create Social Campaign' : 'Configure Social Campaign'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {modalStep === 'method' ? (
          /* STEP 1: CHOOSE A START METHOD */
          <div className="space-y-6 pt-2 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select how you would like to initiate your social campaign project. You can immediately brainstorm custom template structures or construct an empty canvas.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {/* Option A: Template AI Generation */}
              <button
                type="button"
                onClick={() => handleSelectMethod('ai')}
                className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-500 dark:border-slate-800 dark:hover:border-purple-500 bg-slate-50 hover:bg-purple-500/5 dark:bg-slate-950 dark:hover:bg-purple-950/10 transition-all duration-200 group flex gap-4 items-start cursor-pointer"
              >
                <div className="p-3 bg-purple-100 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-display">✨ Start with Template & AI</span>
                    <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-bold uppercase rounded tracking-wider">Recommended</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Auto-research a brand website and generate a structured campaign sequence matching custom content templates (e.g., Product Launch, Educational thread).
                  </p>
                </div>
              </button>

              {/* Option B: Empty Sandbox */}
              <button
                type="button"
                onClick={() => handleSelectMethod('empty')}
                className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-500 dark:border-slate-800 dark:hover:border-purple-500 bg-slate-50 hover:bg-purple-500/5 dark:bg-slate-950 dark:hover:bg-purple-950/10 transition-all duration-200 group flex gap-4 items-start cursor-pointer"
              >
                <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-display">📁 Start from Scratch (Empty Canvas)</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Initialize an empty campaign project timeline to manual design, edit, and append post items yourself from the ground up.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: DETAILS SCREEN */
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {startMethod === 'ai' 
                ? 'Fill in brand details and select a content blueprint template. Gemini will search the live web to customize copies.' 
                : 'Configure basic project settings for your empty campaign timeline.'}
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Project / Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Backup Launch (Optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Company Website URL</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://examplecompany.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Main Campaign Topic / Objective</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Announcing our new distributed databases with ultra-low latency."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none cursor-pointer"
                  >
                    {['Instagram', 'LinkedIn', 'Twitter/X', 'Facebook'].map(p => (
                      <option key={p} value={p} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">AIPost Count</label>
                  <select
                    value={postCount}
                    onChange={(e) => setPostCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none cursor-pointer"
                  >
                    {[3, 5, 7, 10].map(c => (
                      <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{c} Posts</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Common Style and Aspect Settings */}
              <div className="grid grid-cols-1 gap-4 p-4 bg-purple-500/5 dark:bg-purple-500/10 rounded-2xl border border-purple-500/20">
                {startMethod === 'ai' && (
                  <div>
                    <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5">Content Format Template</label>
                    <select
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-purple-500/30 rounded-xl text-xs outline-none cursor-pointer font-medium"
                    >
                      <option value="carousel_step_by_step" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎠 Step-by-Step Educational Carousel Deck</option>
                      <option value="carousel_product_feature" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎠 Product Feature Storyboard Carousel Deck</option>
                      <option value="carousel_infographic_story" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎠 Infographic & Data Visual Carousel Deck</option>
                      <option value="carousel_listicle_quotes" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎠 Top Tips & Listicle Carousel Deck</option>
                      <option value="product_launch" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🚀 Product Launch & Feature Showcase</option>
                      <option value="educational" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">📚 Educational Deep Dive & Multi-Slide</option>
                      <option value="viral" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎭 Viral Engagement & Relatable Memes</option>
                      <option value="roundup" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">📰 Curated Weekly Roundup & Industry News</option>
                      <option value="success" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🏆 Customer Case Study & Metrics</option>
                      <option value="qa" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">💬 Community Q&A & Core FAQ</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AspectRatioIcon aspect={preferredAspect} className="text-purple-500" />
                      <span>Target Aspect Ratio</span>
                    </label>
                    <select
                      value={preferredAspect}
                      onChange={(e) => setPreferredAspect && setPreferredAspect(e.target.value as AspectRatio)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-purple-500/30 rounded-xl text-xs outline-none cursor-pointer font-medium"
                    >
                      <option value="1:1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1:1 Square (Feed Post)</option>
                      <option value="9:16" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">9:16 Portrait (Mobile Story / Reel)</option>
                      <option value="16:9" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">16:9 Landscape (Desktop / Banner)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5">Design / Visual Style</label>
                    <select
                      value={preferredStyle}
                      onChange={(e) => setPreferredStyle && setPreferredStyle(e.target.value as VisualStyle)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-purple-500/30 rounded-xl text-xs outline-none cursor-pointer font-medium"
                    >
                      <option value="Default" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">✨ Default (Let AI Decide)</option>
                      <option value="Carousel" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎠 Multi-Slide Carousel Deck</option>
                      <option value="Minimalist" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎨 Minimalist Clean</option>
                      <option value="Realistic" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">📷 Photorealistic</option>
                      <option value="3D Render" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🧊 3D Isometric / Render</option>
                      <option value="Futuristic" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">⚡ Cyber Futuristic</option>
                      <option value="Cartoon" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">✏️ Cartoon / Illustration</option>
                      <option value="Vintage" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">📻 Retro Vintage</option>
                      <option value="Sketch" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">✍️ Hand Sketch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5">Custom Style Guidelines (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dark mode, neon purple accents, technical diagram callouts"
                    value={styleGuide}
                    onChange={(e) => setStyleGuide(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-purple-500/30 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                </div>
              </div>


              {/* Back & Submit triggers */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setModalStep('method')}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{startMethod === 'ai' ? '✨ Create & AI Generate' : '📁 Create Empty Folder'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

interface ManualPostModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  setTitle: (t: string) => void;
  prompt: string;
  setPrompt: (p: string) => void;
  caption: string;
  setCaption: (c: string) => void;
  style: VisualStyle;
  setStyle: (s: VisualStyle) => void;
  aspect: AspectRatio;
  setAspect: (r: AspectRatio) => void;
  hashtags: string;
  setHashtags: (h: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddPostManualModal: React.FC<ManualPostModalProps> = ({
  show,
  onClose,
  title,
  setTitle,
  prompt,
  setPrompt,
  caption,
  setCaption,
  style,
  setStyle,
  aspect,
  setAspect,
  hashtags,
  setHashtags,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Add Campaign Post</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Append a custom manual post variant to this project timeline.</p>
        
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Post Title / Main Topic</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Database Speeds"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Visual Prompt Guideline</label>
            <textarea
              required
              rows={2}
              placeholder="Detailed description for the Knowledge Visualizer (e.g. A comparison chart of distributed server latency, isometric server nodes, deep corporate violet theme...)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Social Caption</label>
            <textarea
              rows={3}
              placeholder="Suggested caption copy for social feeds."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Visual Style Preset</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as VisualStyle)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none cursor-pointer"
              >
                {['Default', 'Minimalist', 'Realistic', 'Cartoon', 'Vintage', 'Futuristic', '3D Render', 'Sketch', 'Carousel'].map(s => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Aspect Ratio</label>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as AspectRatio)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none cursor-pointer"
              >
                {['1:1', '16:9', '9:16'].map(r => (
                  <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Hashtags (Comma-separated)</label>
            <input
              type="text"
              placeholder="SaaS, cloud, technology"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              Append Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
