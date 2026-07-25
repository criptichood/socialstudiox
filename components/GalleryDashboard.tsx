/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { 
  History, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCcw, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Globe,
  GraduationCap,
  Sparkles,
  Monitor,
  Smartphone,
  Square,
  Wand2
} from 'lucide-react';

interface GalleryDashboardProps {
  images: GeneratedImage[];
  onSelectImage: (img: GeneratedImage) => void;
  onDeleteImage: (id: string) => void;
  onClearAll: () => void;
  onLoadForTweaking: (img: GeneratedImage) => void;
  activeProjectId?: string | null;
  projects?: { id: string; name: string }[];
}

const GalleryDashboard: React.FC<GalleryDashboardProps> = ({
  images,
  onSelectImage,
  onDeleteImage,
  onClearAll,
  onLoadForTweaking,
  activeProjectId,
  projects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<'all' | 'active'>(activeProjectId ? 'active' : 'all');

  const filteredImages = images.filter(img => {
    // Project Isolation Filter
    if (projectFilter === 'active' && activeProjectId) {
      const imgProjectId = img.subOptions?.projectId || 'proj-1';
      if (imgProjectId !== activeProjectId) {
        return false;
      }
    }

    const term = searchTerm.toLowerCase();
    return (
      img.prompt.toLowerCase().includes(term) ||
      (img.imagePrompt && img.imagePrompt.toLowerCase().includes(term)) ||
      (img.style && img.style.toLowerCase().includes(term)) ||
      (img.level && img.level.toLowerCase().includes(term))
    );
  });

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const getResolutionIcon = (res: string) => {
    switch (res) {
      case '9:16': return <Smartphone className="w-3.5 h-3.5" />;
      case '1:1': return <Square className="w-3.5 h-3.5" />;
      case '16:9':
      default:
        return <Monitor className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-12 md:mt-20 border-t border-slate-200 dark:border-white/10 pt-10 relative z-10">
      
      {/* Header section with Stats and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5 font-display">
            <History className="w-4 h-4 text-cyan-500 animate-spin" style={{ animationDuration: '25s' }} />
            Premium Design Gallery & Archives
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Every iteration, generation, and edit is automatically preserved in IndexedDB. Select, compare, or restore designs instantly.
          </p>
        </div>

        {/* Clear All button */}
        {images.length > 0 && (
          <button
            id="clear-all-gallery-btn"
            onClick={() => {
              if (confirm("Are you sure you want to clear your entire local visual gallery? This cannot be undone.")) {
                onClearAll();
              }
            }}
            className="self-start md:self-auto px-4 py-2 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl transition-all border border-red-200/30 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Database</span>
          </button>
        )}
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            id="gallery-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter generations by topic, style, complexity level, or visual instructions..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs md:text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-sm"
          />
        </div>

        {activeProjectId && (
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setProjectFilter('active')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                projectFilter === 'active'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Active Project Sandbox
            </button>
            <button
              type="button"
              onClick={() => setProjectFilter('all')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                projectFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Workspace Vaults
            </button>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => (
            <div 
              key={img.id}
              className="group relative flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-2xl hover:border-cyan-500/40 transition-all bg-white dark:bg-slate-900/40 backdrop-blur-sm transform hover:scale-[1.01]"
            >
              
              {/* Media Preview Container */}
              <div 
                onClick={() => onSelectImage(img)}
                className="relative overflow-hidden cursor-pointer bg-slate-950 flex items-center justify-center border-b border-slate-100 dark:border-white/5"
              >
                {/* Specific aspect ratio container styling */}
                <div className={`w-full relative transition-all duration-300 ${
                  img.resolution === '9:16' ? 'aspect-[9/16] max-h-[350px]' : 
                  img.resolution === '1:1' ? 'aspect-square max-h-[250px]' : 
                  'aspect-video'
                }`}>
                  <img 
                    src={img.data} 
                    alt={img.prompt} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Float Aspect Ratio & Calibration Overlay */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-sm">
                    {getResolutionIcon(img.resolution || '16:9')}
                    <span>{img.resolution || '16:9'}</span>
                  </span>
                  
                  {img.level && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-900/90 backdrop-blur-md border border-cyan-500/30 text-[9px] font-bold text-cyan-200 uppercase tracking-wider">
                      <GraduationCap className="w-2.5 h-2.5" />
                      <span>{img.level}</span>
                    </span>
                  )}
                </div>

                {/* Hover Quick Select Overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <span className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-lg shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      View full canvas
                   </span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-display font-bold text-sm md:text-base text-slate-900 dark:text-white truncate" title={img.prompt}>
                      {img.prompt}
                    </h4>
                    <button
                      id={`delete-generation-btn-${img.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${img.prompt}" from your archive?`)) {
                          onDeleteImage(img.id);
                        }
                      }}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/20 shrink-0"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Calibration styles display */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {img.style && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Style: {img.style}
                      </span>
                    )}
                    {img.language && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Lang: {img.language}
                      </span>
                    )}
                  </div>

                  {/* Calendar stamp */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-4">
                     <Calendar className="w-3.5 h-3.5" />
                     <span>{new Date(img.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Expandable Visual Prompt Details block */}
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3">
                  
                  <div className="flex items-center justify-between">
                     <button
                        id={`toggle-prompt-details-btn-${img.id}`}
                        onClick={(e) => toggleExpand(img.id, e)}
                        className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                     >
                        <span>{expandedId === img.id ? 'Hide Visual Prompt' : 'Reveal Visual Prompt'}</span>
                        {expandedId === img.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                     </button>

                     <button
                        id={`copy-prompt-btn-${img.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPrompt(img.id, img.imagePrompt || img.prompt);
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1"
                        title="Copy visual prompt"
                     >
                        {copiedId === img.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Copy</span>
                          </>
                        )}
                     </button>
                  </div>

                  {expandedId === img.id && img.imagePrompt && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] md:text-xs font-mono text-slate-600 dark:text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto break-words animate-in fade-in duration-300">
                      {img.imagePrompt}
                    </div>
                  )}

                  {/* Reuse / Re-tweak button (Core Iteration Loop) */}
                  <button
                    id={`load-prompt-tweak-btn-${img.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadForTweaking(img);
                      // Scroll smoothly back to input form
                      const searchInput = document.getElementById('topic-search-input');
                      if (searchInput) {
                        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        searchInput.focus();
                      }
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/10 group-hover:scale-[1.01]"
                    title="Reload all original parameters and prompts into the Prompt Studio to iterate further"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                    <span>Reload & Iterate Design</span>
                  </button>

                </div>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-sm">
           <History className="w-12 h-12 text-slate-400 mx-auto mb-3.5 stroke-[1.5]" />
           <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No matching designs found in local archive</p>
           <p className="text-xs text-slate-400 mt-1">Try launching a new topic to start tracking iterations.</p>
        </div>
      )}

    </div>
  );
};

export default GalleryDashboard;
