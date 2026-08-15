import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GeneratedImage, PresenterSlide, SlideAnimation, SlideAudioTrack } from '../types';
import { DBService } from '../services/dbService';
import { 
  Presentation, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Upload, 
  ImageIcon, 
  Sparkles, 
  Mic, 
  Layers, 
  Wand2, 
  ArrowLeft, 
  Sun, 
  Moon, 
  RefreshCw, 
  Loader2, 
  Sliders, 
  X,
  Copy as CopyIcon,
  Type,
  Check,
  Move,
  Smile,
  Globe
} from 'lucide-react';
import { generateVoiceOverSpeech } from '../services/geminiService';

interface TextOverlayItem {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // exact numeric font size in pixels (e.g., 24)
  fontFamily: 'sans' | 'serif' | 'mono' | 'display' | 'handwriting';
  textStyle: 'clean' | '3d' | 'ethereal' | 'neon' | 'glass';
  color: string;
  bg?: string;
}

interface ExtendedPresenterSlide extends PresenterSlide {
  textOverlays?: TextOverlayItem[];
}

interface PresenterStudioProps {
  images: GeneratedImage[];
  activeProjectId?: string | null;
  onBackToDashboard: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSelectKey?: () => void;
}

const DEFAULT_SLIDES: ExtendedPresenterSlide[] = [
  {
    id: 'slide-1',
    slideNumber: 1,
    title: 'Slide 1',
    layout: 'hero',
    animation: {
      intro: 'zoom',
      floating: 'pulse',
      overlayAnimation: 'pop',
      duration: 1.2
    },
    textOverlays: [],
    slideDuration: 5
  },
  {
    id: 'slide-2',
    slideNumber: 2,
    title: 'Slide 2',
    layout: 'hero',
    animation: {
      intro: 'slide_left',
      floating: 'drift',
      overlayAnimation: 'ripple',
      duration: 1.5
    },
    textOverlays: [],
    slideDuration: 5
  }
];

export const PresenterStudio: React.FC<PresenterStudioProps> = ({
  images,
  activeProjectId,
  onBackToDashboard,
  isDarkMode = true,
  onToggleDarkMode,
  onSelectKey
}) => {
  const storageKey = `presenter_studio_slides_${activeProjectId || 'default'}`;
  const [slides, setSlides] = useState<ExtendedPresenterSlide[]>(DEFAULT_SLIDES);
  const [isSlidesLoaded, setIsSlidesLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSlides = async () => {
      try {
        const saved = await DBService.getItem<ExtendedPresenterSlide[]>(storageKey, DEFAULT_SLIDES);
        if (isMounted) {
          if (Array.isArray(saved) && saved.length > 0) {
            setSlides(saved);
          }
          setIsSlidesLoaded(true);
        }
      } catch (e) {
        console.error("Failed to load presenter slides from IndexedDB:", e);
        if (isMounted) setIsSlidesLoaded(true);
      }
    };
    fetchSlides();
    return () => { isMounted = false; };
  }, [storageKey]);

  useEffect(() => {
    if (isSlidesLoaded) {
      DBService.setItem(storageKey, slides).catch(e => console.error("Failed to save presenter slides to IndexedDB:", e));
    }
  }, [slides, storageKey, isSlidesLoaded]);

  const [activeSlideId, setActiveSlideId] = useState<string>(slides[0]?.id || DEFAULT_SLIDES[0].id);

  // Active toolbar tab ('image' | 'voiceover' | 'motion' | 'text')
  const [activeTab, setActiveTab] = useState<'image' | 'text' | 'motion' | 'voiceover'>('image');

  // Image import modal state
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Campaign import modal state
  const [isCampaignImportOpen, setIsCampaignImportOpen] = useState(false);
  const [savedCampaignsList, setSavedCampaignsList] = useState<any[]>([]);

  const loadSavedCampaigns = async () => {
    try {
      const campaigns = await DBService.getItem<any[]>('infogenius_saved_campaigns', []);
      setSavedCampaignsList(campaigns || []);
    } catch (e) {
      console.error("Failed to load saved campaigns from IndexedDB:", e);
    }
  };

  const handleImportCampaignSlides = (campaign: any) => {
    if (!campaign || !campaign.posts || !Array.isArray(campaign.posts)) return;
    const importedSlides: ExtendedPresenterSlide[] = campaign.posts.map((post: any, idx: number) => ({
      id: `slide-camp-${Date.now()}-${idx}`,
      slideNumber: idx + 1,
      title: post.title || `Post ${idx + 1}`,
      layout: 'hero',
      imageUrl: post.imageUrl || undefined,
      animation: {
        intro: 'zoom',
        floating: 'pulse',
        overlayAnimation: 'pop',
        duration: 1.2
      },
      textOverlays: [
        { id: `t-camp-${idx}`, text: post.title || post.caption?.substring(0, 40) || 'Campaign Slide', x: 10, y: 15, fontSize: 32, fontFamily: 'display', textStyle: '3d', color: '#ffffff', bg: 'rgba(0,0,0,0.6)' }
      ],
      slideDuration: 6
    }));
    if (importedSlides.length > 0) {
      setSlides(importedSlides);
      setActiveSlideId(importedSlides[0].id);
    }
    setIsCampaignImportOpen(false);
  };

  // Voiceover state in property panel
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [voiceScript, setVoiceScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'>('Puck');

  // New Text Overlay Input State & Editing State
  const [newTextContent, setNewTextContent] = useState('');
  const [selectedFontSizeNum, setSelectedFontSizeNum] = useState<number>(32);
  const [selectedFontFamily, setSelectedFontFamily] = useState<'sans' | 'serif' | 'mono' | 'display' | 'handwriting'>('display');
  const [selectedTextStyle, setSelectedTextStyle] = useState<'clean' | '3d' | 'ethereal' | 'neon' | 'glass'>('3d');
  const [selectedTextColor, setSelectedTextColor] = useState('#ffffff');
  const [selectedTextBg, setSelectedTextBg] = useState<string>('rgba(0,0,0,0.6)');
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);

  // Stage reference for robust drag and drop
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Slideshow Presentation mode
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentingSlideIndex, setPresentingSlideIndex] = useState(0);
  const [isPlayingPresentation, setIsPlayingPresentation] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const getAnimationClass = (intro?: string) => {
    switch (intro) {
      case 'zoom': return 'animate-in zoom-in-75 duration-700';
      case 'slide_left': return 'animate-in slide-in-from-left duration-700';
      case 'slide_right': return 'animate-in slide-in-from-right duration-700';
      case 'fade': return 'animate-in fade-in duration-700';
      case 'bounce': return 'animate-bounce';
      case 'tilt': return 'transition-transform duration-700 hover:rotate-3';
      default: return 'animate-in fade-in duration-500';
    }
  };

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-play slide audio when presenting slide changes
  useEffect(() => {
    if (isPresenting) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);

      const currentSlide = slides[presentingSlideIndex];
      if (currentSlide?.audioTrack?.url && !isAudioMuted) {
        const audio = new Audio(currentSlide.audioTrack.url);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.play().then(() => setIsPlayingAudio(true)).catch(() => {});
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPresenting, presentingSlideIndex, isAudioMuted, slides]);

  useEffect(() => {
    let interval: any = null;
    if (isPresenting && isPlayingPresentation) {
      const currentSlide = slides[presentingSlideIndex];
      const durationSec = Math.max(currentSlide?.slideDuration || 5, currentSlide?.audioTrack?.duration || 6);
      const maxTicks = durationSec * 10;
      interval = setInterval(() => {
        setPresentationTimer(prev => {
          if (prev >= maxTicks) {
            if (presentingSlideIndex < slides.length - 1) {
              setPresentingSlideIndex(i => i + 1);
              return 0;
            } else {
              setIsPlayingPresentation(false);
              return 0;
            }
          }
          return prev + 1;
        });
      }, 100);
    } else {
      setPresentationTimer(0);
    }
    return () => clearInterval(interval);
  }, [isPresenting, isPlayingPresentation, presentingSlideIndex, slides]);

  // Animation trigger key
  const [animationKey, setAnimationKey] = useState(0);

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];

  const projectImages = images.filter(img => {
    if (activeProjectId) {
      return (img.subOptions?.projectId || 'proj-1') === activeProjectId;
    }
    return true;
  });

  // Gather all generated voiceovers across the project for reuse
  const allProjectVoiceovers = slides
    .filter(s => s.audioTrack && s.audioTrack.url)
    .map(s => ({ slideNum: s.slideNumber, track: s.audioTrack! }));

  const handleSelectSlide = (slideId: string) => {
    setActiveSlideId(slideId);
    setAnimationKey(prev => prev + 1);
    stopAudio();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
  };

  const handleAddSlide = () => {
    const newSlide: ExtendedPresenterSlide = {
      id: `slide-${Date.now()}`,
      slideNumber: slides.length + 1,
      title: `Slide ${slides.length + 1}`,
      layout: 'hero',
      imageUrl: undefined, // New slides start with NO image inherited automatically
      animation: {
        intro: 'fade',
        floating: 'none',
        overlayAnimation: 'none',
        duration: 1.0
      },
      textOverlays: [], // New slides start with NO preset text overlay
      slideDuration: 5
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const handleDuplicateSlide = (slide: ExtendedPresenterSlide, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup: ExtendedPresenterSlide = {
      ...slide,
      id: `slide-${Date.now()}`,
      slideNumber: slides.length + 1,
      title: `${slide.title} (Copy)`
    };
    setSlides(prev => [...prev, dup]);
    setActiveSlideId(dup.id);
  };

  const handleDeleteSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    const filtered = slides.filter(s => s.id !== id).map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setSlides(filtered);
    if (activeSlideId === id) {
      setActiveSlideId(filtered[0].id);
    }
  };

  const updateActiveSlide = (fields: Partial<ExtendedPresenterSlide>) => {
    setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, ...fields } : s));
  };

  const updateAnimation = (fields: Partial<SlideAnimation>) => {
    setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, animation: { ...s.animation, ...fields } } : s));
  };

  const handleSelectImage = (url?: string) => {
    updateActiveSlide({ imageUrl: url });
    setIsImagePickerOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        handleSelectImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOrUpdateTextOverlay = () => {
    if (!newTextContent.trim()) return;
    if (editingOverlayId) {
      const updated = (activeSlide.textOverlays || []).map(t => {
        if (t.id === editingOverlayId) {
          return {
            ...t,
            text: newTextContent.trim(),
            fontSize: selectedFontSizeNum,
            fontFamily: selectedFontFamily,
            textStyle: selectedTextStyle,
            color: selectedTextColor,
            bg: selectedTextBg
          };
        }
        return t;
      });
      updateActiveSlide({ textOverlays: updated });
      setEditingOverlayId(null);
    } else {
      const newOverlay: TextOverlayItem = {
        id: `text-${Date.now()}`,
        text: newTextContent.trim(),
        x: 15,
        y: 20 + ((activeSlide.textOverlays?.length || 0) * 12),
        fontSize: selectedFontSizeNum,
        fontFamily: selectedFontFamily,
        textStyle: selectedTextStyle,
        color: selectedTextColor,
        bg: selectedTextBg
      };
      const updated = [...(activeSlide.textOverlays || []), newOverlay];
      updateActiveSlide({ textOverlays: updated });
    }
    setNewTextContent('');
  };

  const handleSelectOverlayForEdit = (t: TextOverlayItem) => {
    setEditingOverlayId(t.id);
    setNewTextContent(t.text);
    setSelectedFontSizeNum(t.fontSize);
    setSelectedFontFamily(t.fontFamily);
    setSelectedTextStyle(t.textStyle);
    setSelectedTextColor(t.color);
    setSelectedTextBg(t.bg || 'transparent');
  };

  const handleRemoveTextOverlay = (overlayId: string) => {
    const updated = (activeSlide.textOverlays || []).filter(t => t.id !== overlayId);
    updateActiveSlide({ textOverlays: updated });
  };

  const handleUpdateOverlayPosition = (overlayId: string, newX: number, newY: number) => {
    const updated = (activeSlide.textOverlays || []).map(t => {
      if (t.id === overlayId) {
        return { ...t, x: Math.max(0, Math.min(85, newX)), y: Math.max(0, Math.min(85, newY)) };
      }
      return t;
    });
    updateActiveSlide({ textOverlays: updated });
  };

  const handleGenerateVoiceover = async () => {
    const script = voiceScript.trim() || activeSlide.title || 'Slide voiceover presentation track';
    setIsGeneratingVoice(true);
    try {
      const url = await generateVoiceOverSpeech(script, selectedVoice);
      updateActiveSlide({
        audioTrack: {
          id: `aud-${Date.now()}`,
          name: `${selectedVoice} Narration (Slide ${activeSlide.slideNumber})`,
          url,
          startTime: 0,
          endTime: 8,
          duration: 8,
          voiceName: selectedVoice
        }
      });
      setVoiceScript('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const toggleAudio = () => {
    if (!activeSlide.audioTrack?.url) return;
    if (isPlayingAudio) {
      stopAudio();
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(activeSlide.audioTrack.url);
      audioRef.current.onended = () => setIsPlayingAudio(false);
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPresenting) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setPresentingSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setPresentingSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPresenting, slides.length]);

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      
      {/* 1. TOP TOOLBAR */}
      <header className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-40">
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onBackToDashboard}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white font-display block leading-none">
                Presenter Studio
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Immersive Visual Deck</span>
            </div>
          </div>
        </div>

        {/* Present Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setPresentingSlideIndex(0);
              setIsPresenting(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-amber-300" />
            <span>Present Slides</span>
          </button>

          {onToggleDarkMode && (
            <button onClick={onToggleDarkMode} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700" title="Toggle Theme">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 p-4 md:p-6 flex flex-col space-y-6 max-w-7xl mx-auto w-full">
        
        {/* ACTIVE SLIDE STAGE WITH FULL IMAGE AND DRAGGABLE OVERLAYS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-600 text-white font-mono text-xs font-bold rounded-xl shadow">
                Slide #{activeSlide.slideNumber}
              </span>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateActiveSlide({ title: e.target.value })}
                className="bg-transparent text-white text-sm font-bold font-display outline-none border-b border-transparent hover:border-slate-700 focus:border-purple-500 px-1 py-0.5"
                placeholder="Slide Title..."
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnimationKey(prev => prev + 1)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replay Animation</span>
              </button>
            </div>
          </div>

          {/* STAGE CONTAINER WITH FULL BLEED IMAGE & OVERLAYS */}
          <div
            ref={stageRef}
            key={animationKey}
            onClick={() => setEditingOverlayId(null)}
            className={`relative aspect-video w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden group select-none flex items-center justify-center cursor-default ${getAnimationClass(activeSlide.animation?.intro)}`}
          >
            {activeSlide.imageUrl ? (
              <img src={activeSlide.imageUrl || undefined} alt="Slide Graphic" className="w-full h-full object-cover" />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImagePickerOpen(true);
                }}
                className="absolute inset-0 border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-950/80 flex flex-col items-center justify-center gap-3 cursor-pointer p-6 text-slate-400 hover:text-purple-300"
              >
                <ImageIcon className="w-12 h-12 text-purple-400 animate-pulse" />
                <span className="text-sm font-bold">Click here to import or select slide image</span>
              </div>
            )}

            {/* DRAGGABLE / POSITIONABLE TEXT OVERLAYS ON TOP OF FULL IMAGE */}
            {(activeSlide.textOverlays || []).map((overlay) => {
              // Determine font family style
              const fontFamilyClass = 
                overlay.fontFamily === 'serif' ? 'font-serif' :
                overlay.fontFamily === 'mono' ? 'font-mono' :
                overlay.fontFamily === 'handwriting' ? 'font-serif italic' :
                overlay.fontFamily === 'sans' ? 'font-sans' : 'font-display';

              // Determine text design style CSS
              const styleCss = 
                overlay.textStyle === '3d' ? { textShadow: '0 4px 0 rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.6)', transform: 'perspective(500px) rotateX(4deg)' } :
                overlay.textStyle === 'ethereal' ? { textShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(168,85,247,0.6)', filter: 'drop-shadow(0 2px 8px rgba(168,85,247,0.5))' } :
                overlay.textStyle === 'neon' ? { textShadow: `0 0 10px ${overlay.color}, 0 0 20px ${overlay.color}, 0 0 30px ${overlay.color}` } :
                overlay.textStyle === 'glass' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' } :
                { textShadow: '0 2px 4px rgba(0,0,0,0.5)' };

              const isSelected = editingOverlayId === overlay.id;

              return (
                <div
                  key={overlay.id}
                  style={{ top: `${overlay.y}%`, left: `${overlay.x}%` }}
                  className={`absolute z-20 cursor-move p-2 transition-all ${isSelected ? 'ring-2 ring-purple-500 bg-purple-950/40 rounded-2xl shadow-xl' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOverlayForEdit(overlay);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleSelectOverlayForEdit(overlay);
                    const stageEl = stageRef.current;
                    if (!stageEl) return;
                    const stageRect = stageEl.getBoundingClientRect();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startPosX = overlay.x;
                    const startPosY = overlay.y;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = ((moveEvent.clientX - startX) / (stageRect.width || 800)) * 100;
                      const deltaY = ((moveEvent.clientY - startY) / (stageRect.height || 450)) * 100;
                      handleUpdateOverlayPosition(
                        overlay.id,
                        Math.max(0, Math.min(90, startPosX + deltaX)),
                        Math.max(0, Math.min(90, startPosY + deltaY))
                      );
                    };

                    const onMouseUp = () => {
                      window.removeEventListener('mousemove', onMouseMove);
                      window.removeEventListener('mouseup', onMouseUp);
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                  }}
                >
                  <div
                    className={`${fontFamilyClass} font-black px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2`}
                    style={{ 
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color, 
                      backgroundColor: overlay.bg === 'transparent' ? 'transparent' : (overlay.bg || 'rgba(0,0,0,0.6)'),
                      ...styleCss
                    }}
                  >
                    {isSelected && <Move className="w-4 h-4 text-purple-400 shrink-0" />}
                    <span>{overlay.text}</span>
                    {isSelected && (
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleRemoveTextOverlay(overlay.id);
                        }}
                        className="ml-2 text-rose-400 hover:text-rose-300 p-0.5 shrink-0"
                        title="Remove Text Box"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Stage Footer Overlay Info */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/70 font-mono bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 z-30">
              <span>Slide {activeSlide.slideNumber} • {activeSlide.audioTrack ? `🎵 Voiceover Active (${activeSlide.audioTrack.voiceName})` : 'No Voiceover'}</span>
              <span>Drag text boxes to reposition</span>
            </div>
          </div>
        </div>

        {/* ACTIVE INSPECTOR PANEL ACCORDING TO TAB */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Slide Property Studio ({activeTab.toUpperCase()})
              </h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('image')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'image' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                Image Asset
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'text' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                Text Overlays
              </button>
              <button
                onClick={() => setActiveTab('motion')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'motion' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                Motion FX
              </button>
              <button
                onClick={() => setActiveTab('voiceover')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'voiceover' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                Voiceover
              </button>
            </div>
          </div>

          {activeTab === 'image' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-bold">Slide Background Visual Asset</span>
                <button
                  onClick={() => setIsImagePickerOpen(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose from Gallery or Upload</span>
                </button>
              </div>

              {activeSlide.imageUrl ? (
                <div className="aspect-video max-h-[200px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center relative group">
                  <img src={activeSlide.imageUrl || undefined} alt="Slide Background" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => setIsImagePickerOpen(true)} className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow">Change Image</button>
                    <button onClick={() => updateActiveSlide({ imageUrl: undefined })} className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow">Remove</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsImagePickerOpen(true)}
                  className="aspect-video max-h-[160px] rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-purple-300 cursor-pointer p-6"
                >
                  <ImageIcon className="w-8 h-8 text-purple-400" />
                  <span className="text-xs font-bold">No image selected. Click to open image library.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    {editingOverlayId ? 'Editing Text Overlay' : 'Add Caption / Text Overlay'}
                  </label>
                  <input
                    type="text"
                    placeholder="Type text or emoji (e.g. 🚀 Milestone)..."
                    value={newTextContent}
                    onChange={(e) => {
                      setNewTextContent(e.target.value);
                      if (editingOverlayId) {
                        // live update
                        const updated = (activeSlide.textOverlays || []).map(t => t.id === editingOverlayId ? { ...t, text: e.target.value } : t);
                        updateActiveSlide({ textOverlays: updated });
                      }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveOrUpdateTextOverlay(); }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    min="12"
                    max="96"
                    value={selectedFontSizeNum}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 24;
                      setSelectedFontSizeNum(val);
                      if (editingOverlayId) {
                        const updated = (activeSlide.textOverlays || []).map(t => t.id === editingOverlayId ? { ...t, fontSize: val } : t);
                        updateActiveSlide({ textOverlays: updated });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Font Family</label>
                  <select
                    value={selectedFontFamily}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSelectedFontFamily(val);
                      if (editingOverlayId) {
                        const updated = (activeSlide.textOverlays || []).map(t => t.id === editingOverlayId ? { ...t, fontFamily: val } : t);
                        updateActiveSlide({ textOverlays: updated });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="display">Display</option>
                    <option value="sans">Sans-Serif</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Monospace</option>
                    <option value="handwriting">Handwriting</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Text Design Style</label>
                  <select
                    value={selectedTextStyle}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSelectedTextStyle(val);
                      if (editingOverlayId) {
                        const updated = (activeSlide.textOverlays || []).map(t => t.id === editingOverlayId ? { ...t, textStyle: val } : t);
                        updateActiveSlide({ textOverlays: updated });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="3d">3D Pop Depth</option>
                    <option value="ethereal">Ethereal Glow</option>
                    <option value="neon">Neon Laser</option>
                    <option value="glass">Glass Frosted</option>
                    <option value="clean">Clean Modern</option>
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Background Fill</label>
                  <select
                    value={selectedTextBg}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTextBg(val);
                      if (editingOverlayId) {
                        const updated = (activeSlide.textOverlays || []).map(t => t.id === editingOverlayId ? { ...t, bg: val } : t);
                        updateActiveSlide({ textOverlays: updated });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="transparent">Transparent / None</option>
                    <option value="rgba(0,0,0,0.6)">Dark Translucent (Default)</option>
                    <option value="rgba(255,255,255,0.85)">Light Frosted Box</option>
                    <option value="rgba(126,34,206,0.7)">Purple Gradient Box</option>
                    <option value="rgba(0,0,0,0.9)">Solid Black Box</option>
                  </select>
                </div>

                <div className="md:col-span-8 flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Color</label>
                      <input
                        type="color"
                        value={selectedTextColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedTextColor(val);
                          if (editingOverlayId) {
                            const updated = (activeSlide.textOverlays || []).map(t => t.id === editingOverlayId ? { ...t, color: val } : t);
                            updateActiveSlide({ textOverlays: updated });
                          }
                        }}
                        className="w-12 h-8 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer p-1"
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {editingOverlayId ? 'Editing selected overlay. Click item below to modify.' : 'Click any overlay item below to edit its properties.'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {editingOverlayId && (
                      <button
                        onClick={() => {
                          setEditingOverlayId(null);
                          setNewTextContent('');
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      onClick={handleSaveOrUpdateTextOverlay}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{editingOverlayId ? 'Save Changes' : 'Add Text Overlay'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 font-mono">Current Slide Overlays ({activeSlide.textOverlays?.length || 0}) - Click to Edit</span>
                <div className="flex flex-wrap gap-2">
                  {(activeSlide.textOverlays || []).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectOverlayForEdit(t)}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all border ${
                        editingOverlayId === t.id
                          ? 'bg-purple-950 border-purple-500 shadow-md'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="font-bold text-white max-w-[200px] truncate">{t.text} ({t.fontSize}px)</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTextOverlay(t.id);
                        }}
                        className="text-rose-400 hover:text-rose-300 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!activeSlide.textOverlays || activeSlide.textOverlays.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No text overlays added to this slide yet. Type above to add one.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'motion' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entrance Animation</label>
                <select
                  value={activeSlide.animation.intro}
                  onChange={(e) => {
                    updateAnimation({ intro: e.target.value as any });
                    setAnimationKey(prev => prev + 1);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                >
                  <option value="fade">Smooth Fade In</option>
                  <option value="slide_right">Slide From Left</option>
                  <option value="slide_left">Slide From Right</option>
                  <option value="slide_up">Rise From Bottom</option>
                  <option value="zoom">Elastic Scale Zoom</option>
                  <option value="bounce">Bouncing Entrance</option>
                  <option value="rotate">Rotating Entrance</option>
                  <option value="flip">3D Card Flip</option>
                  <option value="elastic">Spring Elastic</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Floating Effect</label>
                <select
                  value={activeSlide.animation.floating}
                  onChange={(e) => {
                    updateAnimation({ floating: e.target.value as any });
                    setAnimationKey(prev => prev + 1);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                >
                  <option value="none">Static</option>
                  <option value="pulse">Subtle Pulse</option>
                  <option value="drift">Parallax Drift</option>
                  <option value="tilt">3D Tilt</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Slide Duration (Seconds)</label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={activeSlide.slideDuration || 5}
                  onChange={(e) => updateActiveSlide({ slideDuration: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'voiceover' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {activeSlide.audioTrack ? (
                <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Voiceover Assigned to Slide #{activeSlide.slideNumber}</span>
                    <p className="text-xs font-bold text-white font-mono">{activeSlide.audioTrack.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={toggleAudio} className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingAudio ? 'Pause' : 'Play Narration'}</span>
                    </button>
                    <button onClick={() => updateActiveSlide({ audioTrack: undefined })} className="text-xs text-rose-400 hover:underline px-2 cursor-pointer">Unassign</button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No voiceover track assigned to Slide #{activeSlide.slideNumber} yet. Synthesize or choose from project library below.</p>
              )}

              {allProjectVoiceovers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300 font-mono">Project Generated Voiceover Library ({allProjectVoiceovers.length})</span>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                    {allProjectVoiceovers.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">From Slide #{item.slideNum} ({item.track.voiceName})</span>
                          <span className="text-xs font-bold text-white font-mono">{item.track.name}</span>
                        </div>
                        <button
                          onClick={() => updateActiveSlide({ audioTrack: item.track })}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Use on Slide #{activeSlide.slideNumber}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-white font-mono block">Synthesize New AI Voiceover</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Voice Preset</label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="Puck">Puck (Energetic Executive)</option>
                      <option value="Charon">Charon (Deep Resonant)</option>
                      <option value="Kore">Kore (Warm Professional)</option>
                      <option value="Fenrir">Fenrir (Authoritative)</option>
                      <option value="Aoede">Aoede (Clear Conversational)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Narration Script</label>
                    <input
                      type="text"
                      placeholder="Script for this slide..."
                      value={voiceScript}
                      onChange={(e) => setVoiceScript(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateVoiceover}
                  disabled={isGeneratingVoice}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingVoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Voice...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-amber-300" />
                      <span>Generate Voiceover Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. MINIATURE SLIDE DECK STRIP (UNDERNEATH) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Slide Deck Thumbnails ({slides.length})</span>
            </span>

            <button
              onClick={handleAddSlide}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slide</span>
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2 pt-1">
            {slides.map((slide) => {
              const isActive = slide.id === activeSlideId;
              return (
                <div
                  key={slide.id}
                  onClick={() => handleSelectSlide(slide.id)}
                  className={`group relative shrink-0 w-48 rounded-2xl border-2 p-2.5 transition-all cursor-pointer flex flex-col gap-2 ${
                    isActive ? 'bg-purple-950/40 border-purple-500 shadow-xl' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      #{slide.slideNumber}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDuplicateSlide(slide, e)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-purple-300"
                        title="Duplicate Slide"
                      >
                        <CopyIcon className="w-3 h-3" />
                      </button>
                      {slides.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSlide(slide.id, e)}
                          className="p-1 hover:bg-rose-950 rounded text-slate-400 hover:text-rose-400"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center p-1">
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl || undefined} alt={slide.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-700" />
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-200 truncate font-display">
                    {slide.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* 4. IMAGE PICKER MODAL */}
      {isImagePickerOpen && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Select Image for Slide #{activeSlide.slideNumber}
                </h3>
              </div>
              <button onClick={() => setIsImagePickerOpen(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Project Generated Gallery ({projectImages.length})</span>
                <button onClick={() => handleSelectImage(undefined)} className="text-rose-400 hover:underline text-[11px] font-bold">Clear Image</button>
              </div>

              {projectImages.length === 0 ? (
                <div className="text-center p-6 border border-slate-800 rounded-2xl bg-slate-950 space-y-2">
                  <p className="text-xs text-slate-400">No generated images in project gallery.</p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Local File</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[260px] overflow-y-auto custom-scrollbar p-1">
                  {projectImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => handleSelectImage(img.data)}
                      className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-purple-500 cursor-pointer group relative shadow-md"
                    >
                      <img src={img.data || undefined} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Or upload from device:</span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer border border-slate-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse Device</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CAMPAIGN IMPORT MODAL */}
      {isCampaignImportOpen && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Import Social Media Campaign / Slides
                </h3>
              </div>
              <button onClick={() => setIsCampaignImportOpen(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Select a saved social media campaign to import its posts as presentation slides (including titles, captions, and generated images).
              </p>

              {savedCampaignsList.length === 0 ? (
                <div className="text-center p-8 border border-slate-800 rounded-2xl bg-slate-950 space-y-2">
                  <p className="text-xs text-slate-400">No saved campaigns found in this project. Create a campaign in Drafts & Campaigns Planner first!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                  {savedCampaignsList.map((camp: any) => (
                    <div
                      key={camp.id}
                      onClick={() => handleImportCampaignSlides(camp)}
                      className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                          {camp.name || 'Untitled Campaign'}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {camp.posts?.length || 0} posts • Platform: {camp.platform || 'Multi'} • Website: {camp.website || 'None'}
                        </p>
                      </div>
                      <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow">
                        Import Slides
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* 6. FULLSCREEN PRESENTATION PORTAL (z-[999999] ABOVE EVERYTHING) */}
      {isPresenting && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col justify-between p-6 md:p-12 animate-in fade-in duration-300">
          
          <div className="flex items-center justify-between text-white/80 z-20">
            <span className="text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
              <Presentation className="w-4 h-4 text-purple-400" />
              <span>Fullscreen Presentation • Slide {presentingSlideIndex + 1} of {slides.length}</span>
            </span>

            <button
              onClick={() => {
                setIsPresenting(false);
                setIsPlayingPresentation(false);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Exit (ESC)</span>
            </button>
          </div>

          {/* Presenter Active Slide Viewport */}
          <div className="flex-1 flex items-center justify-center my-4 relative max-w-6xl mx-auto w-full max-h-[72vh]">
            {slides[presentingSlideIndex] && (
              <div 
                key={`present-slide-${presentingSlideIndex}-${animationKey}`}
                className={`w-full aspect-video bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden flex items-center justify-center ${getAnimationClass(slides[presentingSlideIndex].animation?.intro)}`}
              >
                {slides[presentingSlideIndex].imageUrl ? (
                  <img src={slides[presentingSlideIndex].imageUrl || undefined} alt="Slide Presentation" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-500 font-mono text-sm">Slide #{slides[presentingSlideIndex].slideNumber} (No Image)</div>
                )}

                {/* Render Text Overlays in Fullscreen */}
                {(slides[presentingSlideIndex].textOverlays || []).map((t) => {
                  const fontFamilyClass = 
                    t.fontFamily === 'serif' ? 'font-serif' :
                    t.fontFamily === 'mono' ? 'font-mono' :
                    t.fontFamily === 'handwriting' ? 'font-serif italic' :
                    t.fontFamily === 'sans' ? 'font-sans' : 'font-display';

                  const styleCss = 
                    t.textStyle === '3d' ? { textShadow: '0 6px 0 rgba(0,0,0,0.8), 0 12px 24px rgba(0,0,0,0.6)', transform: 'perspective(500px) rotateX(4deg)' } :
                    t.textStyle === 'ethereal' ? { textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(168,85,247,0.7)', filter: 'drop-shadow(0 4px 12px rgba(168,85,247,0.6))' } :
                    t.textStyle === 'neon' ? { textShadow: `0 0 15px ${t.color}, 0 0 30px ${t.color}, 0 0 45px ${t.color}` } :
                    t.textStyle === 'glass' ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)' } :
                    { textShadow: '0 2px 4px rgba(0,0,0,0.5)' };

                  return (
                    <div
                      key={t.id}
                      style={{ top: `${t.y}%`, left: `${t.x}%` }}
                      className="absolute z-30"
                    >
                      <div
                        className={`${fontFamilyClass} font-black px-6 py-3 rounded-2xl shadow-2xl`}
                        style={{ 
                          fontSize: `${Math.round(t.fontSize * 1.35)}px`,
                          color: t.color, 
                          backgroundColor: t.bg === 'transparent' ? 'transparent' : (t.bg || 'rgba(0,0,0,0.6)'),
                          ...styleCss
                        }}
                      >
                        {t.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Presentation Footer Nav Controls with Play/Pause & Audio Toggle */}
          <div className="flex flex-col space-y-3 z-20 max-w-xl mx-auto w-full">
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-purple-500 h-full transition-all duration-100"
                style={{
                  width: `${Math.min(100, (presentationTimer / ((Math.max(slides[presentingSlideIndex]?.slideDuration || 5, slides[presentingSlideIndex]?.audioTrack?.duration || 6)) * 10)) * 100)}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setPresentingSlideIndex(prev => Math.max(0, prev - 1))}
                disabled={presentingSlideIndex === 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingPresentation(!isPlayingPresentation)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  {isPlayingPresentation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlayingPresentation ? 'Pause' : 'Play Presentation'}</span>
                </button>

                {slides[presentingSlideIndex]?.audioTrack && (
                  <button
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
                      isAudioMuted 
                        ? 'bg-rose-950/60 border-rose-800 text-rose-300' 
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-purple-300'
                    }`}
                    title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span>{isAudioMuted ? 'Muted' : 'Audio On'}</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setPresentingSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={presentingSlideIndex === slides.length - 1}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>,
        document.body
      )}

    </div>
  );
};
