import React, { useState, useEffect } from 'react';
import { GeneratedImage, Project } from '../types';
import * as Exporter from '../services/exportService';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Download, 
  FileText, 
  Database, 
  Sparkles, 
  SlidersHorizontal,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
  Check,
  FolderPlus,
  Folder,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';

interface PresentationDeckProps {
  project: Project;
  images: GeneratedImage[];
  allImages: GeneratedImage[];
  projects: Project[];
  onImportImages: (imageIds: string[]) => void;
  onClose: () => void;
}

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ 
  project, 
  images, 
  allImages, 
  projects, 
  onImportImages, 
  onClose 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(5000); // ms per slide
  const [showBriefSidebar, setShowBriefSidebar] = useState(true);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [importSearch, setImportSearch] = useState('');
  const [selectedFilterProjectId, setSelectedFilterProjectId] = useState<string>('all');

  const importableImages = allImages.filter(img => {
    const imgProjId = img.subOptions?.projectId || 'proj-1';
    return imgProjId !== project.id;
  });

  const filteredImportableImages = importableImages.filter(img => {
    const imgProjId = img.subOptions?.projectId || 'proj-1';
    const matchesProject = selectedFilterProjectId === 'all' || imgProjId === selectedFilterProjectId;
    const matchesSearch = img.prompt.toLowerCase().includes(importSearch.toLowerCase()) || 
                          (img.imagePrompt && img.imagePrompt.toLowerCase().includes(importSearch.toLowerCase()));
    return matchesProject && matchesSearch;
  });

  // Total slides = 1 (intro slide) + images length
  const totalSlides = 1 + images.length;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, autoPlaySpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, autoPlaySpeed, totalSlides]);

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Trigger copied notification
  const triggerCopyNotification = (type: string) => {
    setCopiedNotification(type);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Helpers delegated to export service
  const exportHTMLReport = () => {
    Exporter.exportHTMLReport(project, images, () => triggerCopyNotification('HTML Report'));
  };

  const exportJSONPackage = () => {
    Exporter.exportJSONPackage(project, images, () => triggerCopyNotification('JSON Data'));
  };

  const exportMarkdownBrief = () => {
    Exporter.exportMarkdownBrief(project, images, () => triggerCopyNotification('Markdown Outline'));
  };

  // Helper active slide image
  const activeImage = currentSlide > 0 ? images[currentSlide - 1] : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col animate-in fade-in duration-300 select-none">
      
      {/* HEADER CONTROLS */}
      <div className="h-16 border-b border-white/5 px-6 flex justify-between items-center bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400">Interactive Presenter</h4>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">{project.name}</h1>
          </div>
        </div>

        {/* Slideshow Control Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono font-bold px-2 text-slate-300">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Next Slide (Right Arrow / Space)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              isPlaying 
                ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/15' 
                : 'bg-slate-800 border-white/5 text-slate-300 hover:text-white'
            }`}
            title={isPlaying ? 'Pause Autoplay' : 'Autoplay Presentation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Autoplay Speed Tuner */}
          {isPlaying && (
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-white/5 px-2.5 py-1 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Interval</span>
              <select
                value={autoPlaySpeed}
                onChange={(e) => setAutoPlaySpeed(parseInt(e.target.value))}
                className="bg-transparent border-none text-[10px] font-mono font-bold text-cyan-400 focus:ring-0 cursor-pointer outline-none"
              >
                <option value={3000} className="bg-slate-900">3s</option>
                <option value={5000} className="bg-slate-900">5s</option>
                <option value={8000} className="bg-slate-900">8s</option>
                <option value={12000} className="bg-slate-900">12s</option>
              </select>
            </div>
          )}

          {/* Sidebar Toggle */}
          {currentSlide > 0 && (
            <button
              onClick={() => setShowBriefSidebar(!showBriefSidebar)}
              className={`p-2 rounded-xl border text-slate-300 hover:text-white transition-colors cursor-pointer hidden lg:flex ${
                showBriefSidebar ? 'bg-slate-800 border-cyan-500/30 text-cyan-400' : 'bg-slate-900 border-white/5'
              }`}
              title="Toggle Researched Briefs Panel"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* EXPORT SUITCASE SYSTEM */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-3.5 h-9 bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-black/30"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export briefcase</span>
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[100] p-2.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5 border-b border-white/5">Compilation Package</p>
                
                <button
                  onClick={() => {
                    exportHTMLReport();
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs hover:bg-white/5 flex items-center gap-3 transition-colors text-slate-200 hover:text-white cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold">Aesthetic HTML Report</p>
                    <p className="text-[9px] text-slate-400">Offline printable PDF showcase</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportMarkdownBrief();
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs hover:bg-white/5 flex items-center gap-3 transition-colors text-slate-200 hover:text-white cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <p className="font-bold">Markdown Briefing Doc</p>
                    <p className="text-[9px] text-slate-400">Structured markdown outlining research</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportJSONPackage();
                    setIsExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs hover:bg-white/5 flex items-center gap-3 transition-colors text-slate-200 hover:text-white cursor-pointer"
                >
                  <Database className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="font-bold">Raw Metadata (JSON)</p>
                    <p className="text-[9px] text-slate-400">Backups of coordinate annotations</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* IMPORT MORE VISUALS BUTTON */}
          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setSelectedImportIds([]);
            }}
            className="px-3.5 h-9 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg text-cyan-400"
            title="Import graphics from other projects into this presentation"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Import Slides</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-xl transition-all cursor-pointer"
            title="Exit Presenter (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* COPIED TOAST NOTIFICATION */}
      {copiedNotification && (
        <div className="fixed top-20 right-6 z-[1000] px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4" />
          <span>Export Complete: downloaded {copiedNotification} successfully!</span>
        </div>
      )}

      {/* ACTIVE PRESENTATION SCREEN SPLIT */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* SLIDE TRANSITION VIEWER STAGE */}
        <div className="flex-grow flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-radial-gradient">
          
          {/* Slide 1: Welcome / Portfolio Introduction Cover Slide */}
          {currentSlide === 0 && (
            <div className="max-w-2xl w-full text-center space-y-6 px-4 md:px-8 py-12 bg-slate-900/60 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 blur-xl rounded-full scale-150 opacity-40 animate-pulse"></div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center border border-cyan-400/30 text-white shadow-xl relative z-10">
                    <Sparkles className="w-7 h-7" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Research Brief Deck</span>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-extrabold font-display leading-tight tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  {project.name}
                </h1>
                <p className="text-xs md:text-sm text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                  {project.description || 'Verified research workspace portfolio compiled with contextual annotations, web references, and graphics.'}
                </p>
              </div>

              <div className="border-t border-white/5 pt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compiled Slides</p>
                  <p className="text-lg font-extrabold text-cyan-400 font-mono mt-0.5">{images.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aesthetic Theme</p>
                  <p className="text-xs font-bold text-white mt-1">Multi-Layout</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Annotation layers</p>
                  <p className="text-lg font-extrabold text-purple-400 font-mono mt-0.5">
                    {images.reduce((acc, img) => acc + (img.annotations?.length || 0), 0)}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/10 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Begin Presentation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Slide 2..N: The Visual Graphics slides */}
          {currentSlide > 0 && activeImage && (
            <div className="relative max-w-full max-h-[80vh] flex flex-col justify-center items-center shadow-2xl rounded-2xl overflow-hidden bg-slate-900 border border-white/15 animate-in zoom-in-95 duration-500 select-none">
              
              <img
                src={activeImage.data}
                alt={activeImage.prompt}
                className="max-h-[75vh] w-auto max-w-full block select-none pointer-events-none origin-center"
              />

              {/* Responsive annotation rendering layer over visual slideshow */}
              <div className="absolute inset-0 z-20 pointer-events-none select-none">
                {activeImage.annotations?.map((ann) => {
                  if (ann.type !== 'text') return null;
                  return (
                    <div
                      key={ann.id}
                      className="absolute px-2 py-1 rounded select-none font-display font-semibold shadow-xl border bg-black/85 border-white/10"
                      style={{
                        left: `${ann.x * 100}%`,
                        top: `${ann.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        color: ann.color,
                        fontSize: `${Math.max((ann.size || 14) * 0.85, 10)}px`
                      }}
                    >
                      <span>{ann.text}</span>
                    </div>
                  );
                })}

                {/* Render vector shapes & arrows on present SVG overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                >
                  {activeImage.annotations?.map((ann) => {
                    if (ann.type === 'pen' && ann.points) {
                      return (
                        <path
                          key={ann.id}
                          d={`M ${ann.points.map(p => `${p.x * 1000} ${p.y * 1000}`).join(' L ')}`}
                          fill="none"
                          stroke={ann.color}
                          strokeWidth={ann.size || 3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
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
                          fill="none"
                          stroke={ann.color}
                          strokeWidth={ann.size || 3}
                        />
                      );
                    }

                    if (ann.type === 'circle') {
                      const rx = ann.x * 1000;
                      const ry = ann.y * 1000;
                      const rw = (ann.width || 0) * 1000;
                      const rh = (ann.height || 0) * 1000;
                      return (
                        <circle
                          key={ann.id}
                          cx={rx}
                          cy={ry}
                          r={Math.sqrt(rw * rw + rh * rh)}
                          fill="none"
                          stroke={ann.color}
                          strokeWidth={ann.size || 3}
                        />
                      );
                    }

                    if (ann.type === 'arrow') {
                      const rx = ann.x * 1000;
                      const ry = ann.y * 1000;
                      const tx = rx + (ann.width || 0) * 1000;
                      const ty = ry + (ann.height || 0) * 1000;
                      const markerId = `present-head-${ann.id}`;
                      return (
                        <g key={ann.id}>
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
                            stroke={ann.color}
                            strokeWidth={ann.size || 3}
                            markerEnd={`url(#${markerId})`}
                          />
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>

              {/* Bottom Topic Overlay Strip */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/0 p-4 pt-10 text-center z-10 pointer-events-none">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block font-display">Slide {currentSlide} Target Topic</span>
                <span className="text-sm font-semibold text-white drop-shadow-md">{activeImage.prompt}</span>
              </div>
            </div>
          )}

        </div>

        {/* INTEGRATED BRIEFING RESEARCH SIDEBAR */}
        {currentSlide > 0 && activeImage && showBriefSidebar && (
          <div className="w-full lg:w-[420px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 overflow-y-auto animate-in slide-in-from-right-4 duration-300">
            
            {/* Header section with parameters */}
            <div className="p-5 border-b border-white/5 space-y-3 shrink-0">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest font-display">Resource Details</span>
              <h3 className="text-base font-bold text-white line-clamp-2">{activeImage.prompt}</h3>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: activeImage.level, color: 'text-cyan-400 bg-cyan-400/10' },
                  { label: activeImage.style, color: 'text-purple-400 bg-purple-400/10' },
                  { label: activeImage.language, color: 'text-amber-400 bg-amber-400/10' },
                  { label: activeImage.resolution, color: 'text-emerald-400 bg-emerald-400/10' }
                ].map((tag, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${tag.color}`}>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Scrolling facts & brief contents */}
            <div className="flex-grow p-5 space-y-6">
              
              {/* Verified core grounding facts */}
              {activeImage.facts && activeImage.facts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Verified Grounding Facts</h4>
                  </div>
                  <div className="space-y-2.5">
                    {activeImage.facts.map((fact, fIdx) => (
                      <div key={fIdx} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed">
                        {fact}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Web Sources & Links */}
              {activeImage.searchResults && activeImage.searchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Grounding Web References</h4>
                  </div>
                  <div className="space-y-2">
                    {activeImage.searchResults.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-3 bg-slate-950/70 border border-cyan-500/15 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-all flex items-center justify-between"
                      >
                        <span className="truncate pr-4">{link.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-cyan-400/70" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive prompt brief disclosure */}
              <div className="space-y-2 pt-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-display">Target Visual Instruction Prompt</span>
                <p className="text-[10px] text-slate-400 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 font-mono italic max-h-40 overflow-y-auto">
                  {activeImage.imagePrompt}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* IMPORT MULTI-PROJECT SLIDES MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Import Slides to Presentation</h3>
                  <p className="text-[11px] text-slate-400">Select generated assets from other projects to add into <span className="text-cyan-400 font-bold">"{project.name}"</span></p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters bar */}
            <div className="p-4 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row gap-3 shrink-0">
              {/* Search */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search other prompts..."
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Project filter */}
              <div className="w-full sm:w-48">
                <select
                  value={selectedFilterProjectId}
                  onChange={(e) => setSelectedFilterProjectId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Other Projects</option>
                  {projects.filter(p => p.id !== project.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selection quick controls */}
            <div className="px-6 py-2 bg-slate-900/60 border-b border-white/5 flex items-center justify-between text-xs shrink-0 text-slate-400">
              <div>
                <span>Showing {filteredImportableImages.length} available slides</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const allIds = filteredImportableImages.map(img => img.id);
                    setSelectedImportIds(allIds);
                  }}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedImportIds([])}
                  className="text-slate-400 hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-grow p-6 overflow-y-auto space-y-3">
              {filteredImportableImages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <Folder className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs">No matching graphics found in other spaces.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredImportableImages.map((img) => {
                    const imgProjId = img.subOptions?.projectId || 'proj-1';
                    const origProj = projects.find(p => p.id === imgProjId);
                    const isSelected = selectedImportIds.includes(img.id);
                    return (
                      <div
                        key={img.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedImportIds(prev => prev.filter(id => id !== img.id));
                          } else {
                            setSelectedImportIds(prev => [...prev, img.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isSelected 
                            ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/5' 
                            : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-950/60'
                        }`}
                      >
                        {/* Image preview */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/5 relative bg-slate-950 flex items-center justify-center">
                          <img src={img.data} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className={`absolute inset-0 bg-cyan-500/20 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                            <Check className="w-5 h-5 text-cyan-400 drop-shadow" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-grow min-w-0 space-y-1">
                          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest truncate">
                            {origProj?.name || 'Default Space'}
                          </p>
                          <p className="text-xs text-white font-semibold line-clamp-2 leading-relaxed">
                            {img.prompt}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {new Date(img.timestamp).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Checkbox */}
                        <div className="shrink-0 pt-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 bg-slate-950/40 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedImportIds.length > 0) {
                    onImportImages(selectedImportIds);
                    setIsImportModalOpen(false);
                    // Reset currentSlide to 0 to prevent index errors
                    setCurrentSlide(0);
                  }
                }}
                disabled={selectedImportIds.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import Selected ({selectedImportIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
