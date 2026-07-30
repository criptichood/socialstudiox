/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImageDownloadDropdown } from './ImageDownloadDropdown';
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
  Wand2,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  ArrowRight,
  Clock,
  ExternalLink,
  Sliders,
  Music,
  Image as ImageIcon
} from 'lucide-react';
import { AudioVaultSection } from './AudioVaultSection';
import { VideoVaultSection } from './VideoVaultSection';

interface GalleryDashboardProps {
  images: GeneratedImage[];
  onSelectImage: (img: GeneratedImage) => void;
  onDeleteImage: (id: string) => void;
  onClearAll: () => void;
  onLoadForTweaking: (img: GeneratedImage) => void;
  activeProjectId?: string | null;
  projects?: { id: string; name: string }[];
  onNavigateToVoiceoverStudio?: () => void;
}

const safeConfirm = (message: string): boolean => {
  try {
    return confirm(message);
  } catch (err) {
    return true;
  }
};

const GalleryDashboard: React.FC<GalleryDashboardProps> = ({
  images,
  onSelectImage,
  onDeleteImage,
  onClearAll,
  onLoadForTweaking,
  activeProjectId,
  projects,
  onNavigateToVoiceoverStudio
}) => {
  const [activeVaultTab, setActiveVaultTab] = useState<'images' | 'videos' | 'audio'>('images');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<'all' | 'active'>(activeProjectId ? 'active' : 'all');
  
  // Interactive Image Preview Modal States
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showModalPrompt, setShowModalPrompt] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showModalDeleteConfirm, setShowModalDeleteConfirm] = useState(false);

  // Handle body overflow to prevent background scrolling
  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setShowModalPrompt(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewImage]);

  // Handle dragging to pan the image
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoomScale <= 1) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(4, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(1, prev - 0.25);
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoomPan = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomIntensity = 0.1;
    if (e.deltaY < 0) {
      // Scroll up: zoom in
      setZoomScale(prev => Math.min(4, prev + zoomIntensity));
    } else {
      // Scroll down: zoom out
      setZoomScale(prev => {
        const next = Math.max(1, prev - zoomIntensity);
        if (next <= 1) {
          setPanOffset({ x: 0, y: 0 });
          return 1;
        }
        return next;
      });
    }
  };

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

  // Safe client-side PNG downloader
  const handleDownloadImage = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = img.data;
    // Sanitize prompt for filename
    const nameSlug = img.prompt
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50);
    a.download = `${nameSlug || 'infographic-asset'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-7xl mx-auto mt-12 md:mt-20 border-t border-slate-200 dark:border-white/10 pt-10 relative z-10 text-left">
      
      {/* Header section with Stats, Actions & Vault Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5 font-display">
            <History className="w-4 h-4 text-cyan-500 animate-[spin_25s_linear_infinite]" />
            <span>Premium Design Gallery & Media Vaults</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Every visual generation, narration track, and edit is automatically preserved in IndexedDB. Select, compare, or restore media assets instantly.
          </p>
        </div>

        {/* Vault Type Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveVaultTab('images')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeVaultTab === 'images'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-cyan-500" />
            <span>Images Vault ({images.length})</span>
          </button>

          <button
            onClick={() => setActiveVaultTab('videos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeVaultTab === 'videos'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Videos Vault</span>
          </button>

          <button
            onClick={() => setActiveVaultTab('audio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeVaultTab === 'audio'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4 text-purple-300" />
            <span>Audio Vault</span>
          </button>
        </div>
      </div>

      {activeVaultTab === 'audio' ? (
        <AudioVaultSection onNavigateToVoiceoverStudio={onNavigateToVoiceoverStudio} />
      ) : activeVaultTab === 'videos' ? (
        <VideoVaultSection />
      ) : (
        <>
          {/* Clear All button & Filter controls for images */}
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

            <div className="flex items-center gap-2">
              {images.length > 0 && (
                <button
                  id="clear-all-gallery-btn"
                  onClick={() => {
                    if (safeConfirm("Are you sure you want to clear your entire local visual gallery? This cannot be undone.")) {
                      onClearAll();
                    }
                  }}
                  className="px-4 py-2.5 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl transition-all border border-red-200/30 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Image Database</span>
                </button>
              )}

              {activeProjectId && (
                <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setProjectFilter('active')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      projectFilter === 'active'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Active Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      projectFilter === 'all'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    All Vaults
                  </button>
                </div>
              )}
            </div>
          </div>

      {/* Main Grid View */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => (
            <div 
              key={img.id}
              onClick={() => {
                handleResetZoomPan();
                setPreviewImage(img);
              }}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow hover:shadow-xl hover:border-cyan-500/40 transition-all bg-slate-900 aspect-video cursor-pointer"
            >
              <img 
                src={img.data || undefined} 
                alt={img.prompt} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />

              {/* Float Aspect Ratio & Calibration Overlay */}
              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-sm">
                  {img.resolution || '16:9'}
                </span>
                {img.style && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-sm capitalize">
                    {img.style}
                  </span>
                )}
              </div>

              {/* Hover Quick Select Overlay & Options */}
              <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
                
                {deleteConfirmId === img.id ? (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-bold text-white mb-2.5">Delete this design permanently?</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onDeleteImage(img.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Top buttons row */}
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <ImageDownloadDropdown
                        imageUrl={img.data}
                        filenameSlug={img.prompt}
                        buttonVariant="icon"
                      />
                      <button
                        onClick={() => setDeleteConfirmId(img.id)}
                        className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-red-400 rounded-lg transition-all border border-white/10 cursor-pointer shadow"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom title info */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {img.prompt}
                      </p>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                        <span>{new Date(img.timestamp).toLocaleDateString()}</span>
                        <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" />
                          <span>Preview</span>
                        </span>
                      </div>
                    </div>
                  </>
                )}

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
      </>
      )}

      {/* ==================== IMMERSIVE IMAGE PREVIEW OVERLAY (PORTALED) ==================== */}
      {previewImage && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          
          {/* Top Header bar with Info, Title & Close */}
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white z-50">
            <div className="min-w-0 pr-4">
              <h3 className="text-sm md:text-base font-bold font-display truncate">
                {previewImage.prompt}
              </h3>
              <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{previewImage.resolution || '16:9'} Layout</span>
                {previewImage.style && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{previewImage.style}</span>
                  </>
                )}
                <span>•</span>
                <span>{new Date(previewImage.timestamp).toLocaleDateString()}</span>
              </p>
            </div>

            <button
              onClick={() => setPreviewImage(null)}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full transition-all border border-white/10 cursor-pointer shadow-md"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Image viewport with drag-to-pan and zoom constraints */}
          <div className="flex-1 w-full max-w-5xl bg-slate-900/40 border border-white/10 rounded-3xl overflow-hidden relative flex items-center justify-center p-4 shadow-2xl">
            
            {/* Grab container with pointer events */}
            <div 
              className={`w-full h-full overflow-hidden flex items-center justify-center p-2 select-none relative ${
                zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={handleWheel}
            >
              <div 
                className="transition-transform duration-200 ease-out origin-center max-h-full max-w-full flex items-center justify-center"
                style={{ 
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})` 
                }}
              >
                <img
                  src={previewImage.data || undefined}
                  alt={previewImage.prompt}
                  className="max-h-[65vh] md:max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Floating Zoom Controls (Left) */}
            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-lg">
              <button
                onClick={handleZoomOut}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold font-mono text-slate-200 px-2 min-w-[40px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {(zoomScale !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                <button
                  onClick={handleResetZoomPan}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[9px] font-extrabold text-white rounded-lg transition-colors cursor-pointer mr-1 animate-in fade-in duration-150"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Floating Resolution/Type Indicator (Right) */}
            <div className="absolute top-4 left-4 z-30 hidden sm:block">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/15 text-[9px] font-bold tracking-widest uppercase text-slate-200 flex items-center gap-1.5">
                {getResolutionIcon(previewImage.resolution || '16:9')}
                <span>{previewImage.resolution || '16:9'} Layout</span>
              </span>
            </div>
          </div>

          {/* Collapsible Prompt Details */}
          {showModalPrompt && (
            <div className="w-full max-w-5xl mt-3 p-4 bg-slate-900 border border-white/10 rounded-2xl text-left text-xs font-mono text-slate-300 leading-relaxed max-h-[150px] overflow-y-auto break-words animate-in slide-in-from-top-2 duration-200 relative">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Generation Prompt</span>
                <button
                  onClick={() => {
                    handleCopyPrompt(previewImage.id, previewImage.imagePrompt || previewImage.prompt);
                  }}
                  className={`text-[10px] px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    copiedId === previewImage.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {copiedId === previewImage.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied Prompt!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
              <p>{previewImage.imagePrompt || previewImage.prompt}</p>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="w-full max-w-5xl mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
            {/* Left side actions: Delete/Close */}
            <div className="flex items-center gap-3">
              {showModalDeleteConfirm ? (
                <div className="flex items-center gap-2 bg-slate-900 border border-red-500/40 p-2 rounded-xl animate-in fade-in duration-200">
                  <span className="text-xs text-red-200 font-bold px-2">Confirm deletion?</span>
                  <button
                    onClick={() => {
                      onDeleteImage(previewImage.id);
                      setPreviewImage(null);
                      setShowModalDeleteConfirm(false);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowModalDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowModalDeleteConfirm(true)}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete entry</span>
                </button>
              )}

              <button
                onClick={() => setShowModalPrompt(!showModalPrompt)}
                className={`px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  showModalPrompt 
                    ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/5' 
                    : 'border-white/10'
                }`}
                title="View original text prompt used to generate this image"
              >
                <Eye className="w-4 h-4" />
                <span>{showModalPrompt ? 'Hide Prompt' : 'View Prompt'}</span>
              </button>
            </div>

            {/* Right side primary action: Download, Open on Canvas, Redesign */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto">
              <ImageDownloadDropdown
                imageUrl={previewImage.data}
                filenameSlug={previewImage.prompt}
                buttonVariant="modal"
                buttonText="Download Image"
              />

              <button
                onClick={() => {
                  onLoadForTweaking(previewImage);
                  setPreviewImage(null);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                title="Reload prompts & auto-attach this image as reference"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Redesign</span>
              </button>

              <button
                onClick={() => {
                  onSelectImage(previewImage);
                  setPreviewImage(null);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                title="Load image into active canvas viewport"
              >
                <Eye className="w-4 h-4 text-cyan-200" />
                <span>Open on Canvas</span>
              </button>
            </div>
          </div>

        </div>,
        document.body
      )}

    </div>
  );
};

export default GalleryDashboard;
