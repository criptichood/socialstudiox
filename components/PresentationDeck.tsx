import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
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
  Square,
  Video,
  Music,
  Volume2,
  Plus,
  Trash2,
  Clock,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  RotateCcw,
  Film,
  Settings,
  Tv
} from 'lucide-react';

interface PresentationDeckProps {
  project: Project;
  images: GeneratedImage[];
  allImages: GeneratedImage[];
  projects: Project[];
  onImportImages: (imageIds: string[]) => void;
  onClose: () => void;
}

interface PresenterSlide {
  id: string;
  mediaSrc: string; // Base64 image, uploaded file base64 or video data
  mediaType: 'image' | 'video';
  prompt: string;
  duration: number; // custom duration in seconds
  transitionEffect: 'none' | 'fade' | 'zoom' | 'slide' | 'pan';
  voiceoverSessionId?: string | null; // associated generated voiceover
}

interface VoiceoverSession {
  id: string;
  projectId: string;
  name: string;
  scriptText: string;
  voiceName: string;
  createdAt: number;
}

const AUDIO_DB_NAME = 'SocialStudioVoiceoverAudioDB';
const AUDIO_STORE_NAME = 'audio_blobs';

const loadAudioFromIndexedDB = async (id: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(AUDIO_STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const blob = getReq.result as Blob;
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

const safeConfirm = (message: string): boolean => {
  try {
    return confirm(message);
  } catch (err) {
    return true;
  }
};

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ 
  project, 
  images, 
  allImages, 
  projects, 
  onImportImages, 
  onClose 
}) => {
  const [viewMode, setViewMode] = useState<'brief_deck' | 'video_presenter'>('brief_deck');
  
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

  // PRESENTER STUDIO TIMELINE STATE
  const [presenterSlides, setPresenterSlides] = useState<PresenterSlide[]>(() => {
    return images.map((img) => ({
      id: img.id,
      mediaSrc: img.data,
      mediaType: 'image',
      prompt: img.prompt,
      duration: 6, // default 6 seconds
      transitionEffect: 'zoom',
      voiceoverSessionId: null
    }));
  });

  const [activePresenterSlideIndex, setActivePresenterSlideIndex] = useState(0);
  const [presenterIsPlaying, setPresenterIsPlaying] = useState(false);
  const [presenterPlaybackProgress, setPresenterPlaybackProgress] = useState(0); // 0 to 100
  const presenterAudioRef = useRef<HTMLAudioElement | null>(null);
  const presenterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  const [voiceoverSessions, setVoiceoverSessions] = useState<VoiceoverSession[]>(() => {
    try {
      const saved = localStorage.getItem('social_studio_voiceover_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      return [];
    }
  });

  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadAllSessionAudios = async () => {
      const urls: Record<string, string> = {};
      for (const sess of voiceoverSessions) {
        const url = await loadAudioFromIndexedDB(sess.id);
        if (url) {
          urls[sess.id] = url;
        }
      }
      setAudioUrls(urls);
    };
    loadAllSessionAudios();
  }, [voiceoverSessions]);

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
    if (isPlaying && viewMode === 'brief_deck') {
      timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, autoPlaySpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, autoPlaySpeed, totalSlides, viewMode]);

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'brief_deck') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          setCurrentSlide((prev) => (prev + 1) % totalSlides);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
        } else if (e.key === 'Escape') {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides, viewMode]);

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

  const exportOfflinePresenterPackage = () => {
    // Generate an incredibly beautiful standalone cinematic offline HTML deck with animated slides, transition effects, synchronized subtitles, audio playbacks, and progress indicators!
    const slidesData = presenterSlides.map((slide, sIdx) => {
      const sess = voiceoverSessions.find(s => s.id === slide.voiceoverSessionId);
      const audioDataUrl = audioUrls[slide.voiceoverSessionId || ''] || '';
      return {
        index: sIdx + 1,
        mediaSrc: slide.mediaSrc,
        mediaType: slide.mediaType,
        prompt: slide.prompt,
        duration: slide.duration,
        transitionEffect: slide.transitionEffect,
        subtitle: sess?.scriptText || slide.prompt,
        audioSrc: audioDataUrl
      };
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cinematic Video Presentation: ${project.name}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020617;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .stage {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #000000;
    }
    .slide-container {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 800ms ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .slide-container.active {
      opacity: 1;
      z-index: 10;
    }
    .media-element {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 12000ms linear;
    }
    .slide-container.active .media-element.zoom {
      transform: scale(1.15);
    }
    .slide-container.active .media-element.pan {
      transform: scale(1.15) translateX(3%);
    }
    .slide-container.active .media-element.slide {
      animation: slideIn 700ms ease-out forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .subtitle-overlay {
      position: absolute;
      bottom: 8%;
      left: 10%;
      right: 10%;
      text-align: center;
      z-index: 100;
      pointer-events: none;
    }
    .subtitle-text {
      background-color: rgba(2, 6, 23, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 1.2rem;
      font-weight: 500;
      line-height: 1.5;
      display: inline-block;
      max-width: 80%;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
    }
    .controls {
      height: 70px;
      background-color: #0f172a;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 30px;
      z-index: 200;
    }
    .controls-left, .controls-right {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .btn {
      background: none;
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 150ms;
    }
    .btn:hover {
      background-color: rgba(255,255,255,0.08);
      border-color: #06b6d4;
    }
    .btn-primary {
      background-color: #06b6d4;
      border-color: #06b6d4;
      color: #020617;
    }
    .btn-primary:hover {
      background-color: #22d3ee;
      color: #020617;
    }
    .progress-bar-container {
      position: absolute;
      bottom: 70px;
      left: 0;
      right: 0;
      height: 5px;
      background-color: rgba(255,255,255,0.1);
      z-index: 200;
    }
    .progress-bar {
      height: 100%;
      width: 0%;
      background-color: #06b6d4;
      transition: width 100ms linear;
    }
    .slide-info {
      font-family: monospace;
      font-size: 0.9rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="stage" id="stage">
    ${slidesData.map((slide, index) => `
      <div class="slide-container ${index === 0 ? 'active' : ''}" id="slide-${index}">
        ${slide.mediaType === 'video' 
          ? `<video src="${slide.mediaSrc}" class="media-element" id="media-${index}" loop muted playsinline></video>`
          : `<img src="${slide.mediaSrc}" class="media-element ${slide.transitionEffect}" id="media-${index}" />`
        }
        <div class="subtitle-overlay">
          <div class="subtitle-text" id="subtitle-${index}">${slide.subtitle}</div>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="progress-bar-container">
    <div class="progress-bar" id="progress-bar"></div>
  </div>

  <div class="controls">
    <div class="controls-left">
      <button class="btn" id="prev-btn">◀ Previous</button>
      <button class="btn btn-primary" id="play-btn">Play Presentation</button>
      <button class="btn" id="next-btn">Next ▶</button>
      <span class="slide-info" id="slide-info">Slide 1 / ${slidesData.length}</span>
    </div>
    <div class="controls-right">
      <button class="btn" onclick="window.close()">Exit Player</button>
    </div>
  </div>

  <script>
    const slides = ${JSON.stringify(slidesData)};
    let currentIndex = 0;
    let isPlaying = false;
    let timer = null;
    let slideStartTime = 0;
    let currentSlideDuration = 0;
    let audioElements = {};

    // Initialize audio elements
    slides.forEach((slide, idx) => {
      if (slide.audioSrc) {
        audioElements[idx] = new Audio(slide.audioSrc);
        audioElements[idx].onended = () => {
          if (isPlaying && idx === currentIndex) {
            nextSlide();
          }
        };
      }
    });

    const stage = document.getElementById('stage');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const slideInfo = document.getElementById('slide-info');
    const progressBar = document.getElementById('progress-bar');

    function updateSlide() {
      // Deactivate all slides
      slides.forEach((_, idx) => {
        const container = document.getElementById('slide-' + idx);
        container.classList.remove('active');
        const media = document.getElementById('media-' + idx);
        if (media && media.tagName === 'VIDEO') {
          media.pause();
          media.currentTime = 0;
        }
        // Stop any audio
        if (audioElements[idx]) {
          audioElements[idx].pause();
          audioElements[idx].currentTime = 0;
        }
      });

      // Activate current
      const activeContainer = document.getElementById('slide-' + currentIndex);
      activeContainer.classList.add('active');
      
      const activeMedia = document.getElementById('media-' + currentIndex);
      if (activeMedia && activeMedia.tagName === 'VIDEO') {
        activeMedia.play().catch(e => console.log('Video autoplay blocked', e));
      }

      // Reset image transform
      if (activeMedia && activeMedia.tagName === 'IMG') {
        activeMedia.style.transform = 'scale(1)';
        setTimeout(() => {
          if (slides[currentIndex].transitionEffect === 'zoom') {
            activeMedia.style.transform = 'scale(1.15)';
          } else if (slides[currentIndex].transitionEffect === 'pan') {
            activeMedia.style.transform = 'scale(1.15) translateX(3%)';
          }
        }, 50);
      }

      slideInfo.innerText = 'Slide ' + (currentIndex + 1) + ' / ' + slides.length;
      progressBar.style.width = '0%';
      slideStartTime = Date.now();
      currentSlideDuration = slides[currentIndex].duration * 1000;

      if (isPlaying) {
        if (audioElements[currentIndex]) {
          audioElements[currentIndex].play().catch(e => {
            console.log("Audio play blocked, fallback to timer", e);
            startTimer();
          });
          // Update duration to match audio length if audio is loaded
          if (audioElements[currentIndex].duration) {
            currentSlideDuration = audioElements[currentIndex].duration * 1000;
          }
        } else {
          startTimer();
        }
      }
    }

    function startTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        const elapsed = Date.now() - slideStartTime;
        const pct = Math.min((elapsed / currentSlideDuration) * 100, 100);
        progressBar.style.width = pct + '%';

        if (elapsed >= currentSlideDuration) {
          clearInterval(timer);
          nextSlide();
        }
      }, 50);
    }

    function play() {
      isPlaying = true;
      playBtn.innerText = 'Pause Presentation';
      updateSlide();
    }

    function pause() {
      isPlaying = false;
      playBtn.innerText = 'Play Presentation';
      if (timer) clearInterval(timer);
      if (audioElements[currentIndex]) {
        audioElements[currentIndex].pause();
      }
      const activeMedia = document.getElementById('media-' + currentIndex);
      if (activeMedia && activeMedia.tagName === 'VIDEO') {
        activeMedia.pause();
      }
    }

    function togglePlay() {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlide();
    }

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', () => {
      prevSlide();
    });
    nextBtn.addEventListener('click', () => {
      nextSlide();
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    });

    // Initial update
    updateSlide();
  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_video_presentation.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedNotification('Cinematic Video Presentation');
  };

  const estimateAudioDuration = (text: string): number => {
    if (!text) return 5;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(Math.ceil(wordCount / 2.3), 3); // ~138 words per minute, min 3s
  };

  // PRESENTER STUDIO EVENT HANDLERS
  const handleAddSlideFromLibrary = (image: GeneratedImage) => {
    const newSlide: PresenterSlide = {
      id: `${image.id}-${Date.now()}`,
      mediaSrc: image.data,
      mediaType: 'image',
      prompt: image.prompt,
      duration: 6,
      transitionEffect: 'zoom',
      voiceoverSessionId: null
    };
    setPresenterSlides(prev => [...prev, newSlide]);
  };

  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          const fileData = event.target.result;
          const newSlide: PresenterSlide = {
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            mediaSrc: fileData,
            mediaType: isVideo ? 'video' : 'image',
            prompt: file.name.split('.')[0] || (isVideo ? 'Uploaded Video' : 'Uploaded Graphic'),
            duration: isVideo ? 10 : 6,
            transitionEffect: 'fade',
            voiceoverSessionId: null
          };
          setPresenterSlides(prev => [...prev, newSlide]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === presenterSlides.length - 1) return;
    
    const nextIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...presenterSlides];
    const temp = updated[index];
    updated[index] = updated[nextIdx];
    updated[nextIdx] = temp;
    
    setPresenterSlides(updated);
    if (activePresenterSlideIndex === index) {
      setActivePresenterSlideIndex(nextIdx);
    } else if (activePresenterSlideIndex === nextIdx) {
      setActivePresenterSlideIndex(index);
    }
  };

  const handleDeleteSlide = (index: number) => {
    if (presenterSlides.length <= 1) {
      toast.error("At least one slide is required in your timeline.");
      return;
    }
    const updated = presenterSlides.filter((_, idx) => idx !== index);
    setPresenterSlides(updated);
    setActivePresenterSlideIndex(prev => Math.min(prev, updated.length - 1));
  };

  const handleUpdateSlideProperty = (index: number, key: keyof PresenterSlide, value: any) => {
    const updated = presenterSlides.map((slide, idx) => {
      if (idx === index) {
        const updatedSlide = { ...slide, [key]: value };
        // If mapping voiceover track, auto-sync duration based on speech speed!
        if (key === 'voiceoverSessionId' && value) {
          const matchedSession = voiceoverSessions.find(s => s.id === value);
          if (matchedSession) {
            updatedSlide.duration = estimateAudioDuration(matchedSession.scriptText);
          }
        }
        return updatedSlide;
      }
      return slide;
    });
    setPresenterSlides(updated);
  };

  // PRESENTER LIVE PLAYBACK ENGINE
  const startPresenterPlayback = () => {
    if (presenterSlides.length === 0) return;
    
    setPresenterIsPlaying(true);
    setPresenterPlaybackProgress(0);
    playPresenterSlide(activePresenterSlideIndex);
  };

  const pausePresenterPlayback = () => {
    setPresenterIsPlaying(false);
    if (presenterTimerRef.current) {
      clearInterval(presenterTimerRef.current);
    }
    if (presenterAudioRef.current) {
      presenterAudioRef.current.pause();
    }
  };

  const stopPresenterPlayback = () => {
    setPresenterIsPlaying(false);
    setActivePresenterSlideIndex(0);
    setPresenterPlaybackProgress(0);
    if (presenterTimerRef.current) {
      clearInterval(presenterTimerRef.current);
    }
    if (presenterAudioRef.current) {
      presenterAudioRef.current.pause();
      presenterAudioRef.current.currentTime = 0;
    }
  };

  const playPresenterSlide = (index: number) => {
    if (presenterTimerRef.current) {
      clearInterval(presenterTimerRef.current);
    }
    if (presenterAudioRef.current) {
      presenterAudioRef.current.pause();
      presenterAudioRef.current.currentTime = 0;
    }

    const currentSlide = presenterSlides[index];
    if (!currentSlide) return;

    // Check if voiceover exists and load
    const audioUrl = currentSlide.voiceoverSessionId ? audioUrls[currentSlide.voiceoverSessionId] : null;
    let totalMs = currentSlide.duration * 1000;

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      presenterAudioRef.current = audio;
      audio.play().catch(e => console.log("Audio play blocked by browser policies", e));
      
      // Override totalMs if audio duration is loaded
      audio.onloadedmetadata = () => {
        if (audio.duration) {
          totalMs = audio.duration * 1000;
          handleUpdateSlideProperty(index, 'duration', Math.ceil(audio.duration));
        }
      };

      audio.onended = () => {
        if (index < presenterSlides.length - 1) {
          setActivePresenterSlideIndex(index + 1);
          playPresenterSlide(index + 1);
        } else {
          setPresenterIsPlaying(false);
          setPresenterPlaybackProgress(100);
        }
      };
    }

    const startTime = Date.now();
    presenterTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalMs) * 100, 100);
      setPresenterPlaybackProgress(pct);

      if (elapsed >= totalMs) {
        clearInterval(presenterTimerRef.current!);
        // If there's no audio track driving onended, advance manually
        if (!audioUrl) {
          if (index < presenterSlides.length - 1) {
            setActivePresenterSlideIndex(index + 1);
            playPresenterSlide(index + 1);
          } else {
            setPresenterIsPlaying(false);
            setPresenterPlaybackProgress(100);
          }
        }
      }
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (presenterTimerRef.current) clearInterval(presenterTimerRef.current);
      if (presenterAudioRef.current) presenterAudioRef.current.pause();
    };
  }, []);

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
          <div className="hidden sm:block">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400">Interactive Presenter</h4>
            <h1 className="text-sm font-bold text-white truncate max-w-[150px] md:max-w-xs">{project.name}</h1>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950/80 p-1 border border-white/5 rounded-xl sm:ml-4">
            <button
              onClick={() => {
                setViewMode('brief_deck');
                stopPresenterPlayback();
              }}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                viewMode === 'brief_deck' 
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard Slides
            </button>
            <button
              onClick={() => {
                setViewMode('video_presenter');
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'video_presenter' 
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Presenter Studio
            </button>
          </div>
        </div>

        {/* View Mode Contextual Header Controls */}
        {viewMode === 'brief_deck' ? (
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
        ) : (
          <div className="flex items-center gap-3">
            {/* Direct Image/Video upload */}
            <input 
              type="file" 
              ref={localFileInputRef}
              onChange={handleUploadLocalFile}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              onClick={() => localFileInputRef.current?.click()}
              className="px-3 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Directly import custom visuals or MP4 presentation videos from your local device"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Import Video / File</span>
            </button>

            {/* Offline Bundle compiler */}
            <button
              onClick={exportOfflinePresenterPackage}
              className="px-4 h-9 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
              title="Compile and download a fully functional offline-playable presentation containing custom visuals and synced voiceover speech!"
            >
              <Film className="w-4 h-4" />
              <span>Compile Video Presentation</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-xl transition-all cursor-pointer"
              title="Exit Presenter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
        
        {viewMode === 'brief_deck' ? (
          <>
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
                    src={activeImage.data || undefined}
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
          </>
        ) : (
          /* NEW: PRESENTER VIDEO STUDIO WORKSPACE LAYOUT */
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden w-full h-full bg-slate-950">
            
            {/* LEFT TIMELINE BUILDER & VOICE-OVER MAPPER */}
            <div className="w-full md:w-[480px] lg:w-[540px] bg-slate-900 border-r border-white/5 flex flex-col overflow-y-auto shrink-0 h-full p-5 space-y-5">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-display">Presenter Timeline</h3>
                  <p className="text-[11px] text-slate-400">Map your audio tracks & arrange graphic sequences</p>
                </div>

                {/* Import slide modal trigger */}
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-[10px] font-bold uppercase text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Import from Library</span>
                </button>
              </div>

              {/* TIMELINE CARDS LIST */}
              <div className="space-y-3.5 flex-grow">
                {presenterSlides.map((slide, index) => {
                  const isSelected = activePresenterSlideIndex === index;
                  const matchingSession = voiceoverSessions.find(s => s.id === slide.voiceoverSessionId);
                  
                  return (
                    <div
                      key={slide.id}
                      onClick={() => setActivePresenterSlideIndex(index)}
                      className={`p-3.5 rounded-2xl border transition-all relative flex flex-col gap-3.5 ${
                        isSelected 
                          ? 'bg-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/5' 
                          : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-950/60'
                      }`}
                    >
                      {/* Top metadata row */}
                      <div className="flex items-start justify-between gap-3 select-none">
                        <div className="flex items-start gap-3">
                          {/* Mini Thumbnail */}
                          <div className="w-12 h-12 rounded-xl border border-white/10 bg-slate-900 shrink-0 overflow-hidden relative flex items-center justify-center">
                            {slide.mediaType === 'video' ? (
                              <video src={slide.mediaSrc || undefined} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={slide.mediaSrc || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )}
                            <div className="absolute bottom-0 right-0 bg-black/80 px-1 py-0.5 rounded text-[8px] font-bold text-slate-300 font-mono">
                              #{index + 1}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                              {slide.mediaType === 'video' ? 'Looped Video Slide' : 'Graphic Slide'}
                            </span>
                            <p className="text-xs font-semibold text-white truncate leading-relaxed max-w-[200px] sm:max-w-[250px]">
                              {slide.prompt}
                            </p>
                          </div>
                        </div>

                        {/* Reorder and Delete controls */}
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleMoveSlide(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-800 disabled:opacity-20 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Move Slide Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSlide(index, 'down')}
                            disabled={index === presenterSlides.length - 1}
                            className="p-1 hover:bg-slate-800 disabled:opacity-20 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Move Slide Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlide(index)}
                            className="p-1 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Remove Slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Configurations for mapping & duration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-white/5 select-none" onClick={e => e.stopPropagation()}>
                        
                        {/* Voiceover Selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            <span>Voiceover Track</span>
                          </label>
                          <select
                            value={slide.voiceoverSessionId || ''}
                            onChange={(e) => handleUpdateSlideProperty(index, 'voiceoverSessionId', e.target.value || null)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                          >
                            <option value="">-- No Audio Track --</option>
                            {voiceoverSessions.map(sess => (
                              <option key={sess.id} value={sess.id}>
                                {sess.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Slide Display Duration in Seconds */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>Duration</span>
                            </span>
                            {matchingSession && (
                              <span className="text-[8px] text-emerald-400 lowercase font-mono bg-emerald-950/50 px-1 py-0.2 rounded border border-emerald-500/20">
                                synced to audio
                              </span>
                            )}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={slide.duration}
                              onChange={(e) => handleUpdateSlideProperty(index, 'duration', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-center text-cyan-400 focus:outline-none focus:border-cyan-500"
                            />
                            <span className="text-[10px] text-slate-500">sec</span>
                            <input
                              type="range"
                              min={1}
                              max={30}
                              value={slide.duration}
                              onChange={(e) => handleUpdateSlideProperty(index, 'duration', parseInt(e.target.value))}
                              className="flex-grow accent-cyan-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Transition Effect selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Transition Effect
                          </label>
                          <select
                            value={slide.transitionEffect}
                            onChange={(e) => handleUpdateSlideProperty(index, 'transitionEffect', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                          >
                            <option value="none">None (Cut)</option>
                            <option value="fade">Cinematic Cross-Fade</option>
                            <option value="zoom">Ken Burns Zoom-In</option>
                            <option value="pan">Dramatic Slide Pan</option>
                            <option value="slide">Dynamic Slide-Left</option>
                          </select>
                        </div>

                        {/* Script view overlay trigger */}
                        {matchingSession && (
                          <div className="flex flex-col justify-end">
                            <div className="bg-slate-900 border border-white/5 rounded-xl p-2 max-h-16 overflow-y-auto">
                              <p className="text-[9px] text-slate-400 italic leading-normal">
                                "{matchingSession.scriptText}"
                              </p>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* RIGHT INTEGRATED CINEMA STAGE & PLAYER */}
            <div className="flex-grow flex flex-col justify-between p-6 relative overflow-hidden bg-black select-none">
              
              {/* STAGE MAIN SCREEN */}
              <div className="flex-grow flex items-center justify-center relative w-full h-full max-h-[70vh]">
                
                {presenterSlides[activePresenterSlideIndex] ? (
                  <div className="relative w-full h-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 flex items-center justify-center">
                    
                    {/* Render visual based on slide transition style */}
                    {presenterSlides[activePresenterSlideIndex].mediaType === 'video' ? (
                      <video 
                        src={presenterSlides[activePresenterSlideIndex].mediaSrc || undefined} 
                        className="w-full h-full object-cover" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                      />
                    ) : (
                      <img
                        src={presenterSlides[activePresenterSlideIndex].mediaSrc || undefined}
                        alt=""
                        className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-[10000ms] ease-out ${
                          presenterIsPlaying 
                            ? presenterSlides[activePresenterSlideIndex].transitionEffect === 'zoom' 
                              ? 'scale-115' 
                              : presenterSlides[activePresenterSlideIndex].transitionEffect === 'pan'
                                ? 'scale-115 translate-x-3'
                                : 'scale-100'
                            : 'scale-100'
                        }`}
                      />
                    )}

                    {/* Subtitle speech overlay */}
                    {voiceoverSessions.find(s => s.id === presenterSlides[activePresenterSlideIndex].voiceoverSessionId) && (
                      <div className="absolute bottom-6 left-6 right-6 text-center z-20 pointer-events-none">
                        <p className="inline-block bg-black/80 backdrop-blur border border-white/10 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-white max-w-[85%] leading-relaxed shadow-xl drop-shadow-md">
                          {voiceoverSessions.find(s => s.id === presenterSlides[activePresenterSlideIndex].voiceoverSessionId)?.scriptText}
                        </p>
                      </div>
                    )}

                    {/* Prompt identifier label */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-bold text-cyan-400 uppercase tracking-widest pointer-events-none">
                      Slide {activePresenterSlideIndex + 1}: {presenterSlides[activePresenterSlideIndex].prompt}
                    </div>

                    {/* Transition badge indicator */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                      {presenterSlides[activePresenterSlideIndex].transitionEffect} Transition
                    </div>

                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <Folder className="w-12 h-12 mx-auto opacity-30 text-slate-400 mb-2" />
                    <p className="text-sm">Timeline has no active presentation slides.</p>
                  </div>
                )}

              </div>

              {/* TIMELINE PROGRESS TRACK METER */}
              <div className="w-full mt-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3.5">
                
                {/* Visual Progress bar representing current slide play length */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                    <span className="text-cyan-400">active slide progression</span>
                    <span>
                      {presenterSlides[activePresenterSlideIndex] ? `${presenterSlides[activePresenterSlideIndex].duration}s` : '0s'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-100 ease-out"
                      style={{ width: `${presenterPlaybackProgress}%` }}
                    />
                  </div>
                </div>

                {/* Main player triggers */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Play / Pause button */}
                    {presenterIsPlaying ? (
                      <button
                        onClick={pausePresenterPlayback}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Studio</span>
                      </button>
                    ) : (
                      <button
                        onClick={startPresenterPlayback}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Play Video Presentation</span>
                      </button>
                    )}

                    <button
                      onClick={stopPresenterPlayback}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-white/5"
                      title="Reset Presentation to Start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Manual sequence skips */}
                  <div className="flex items-center gap-3.5 text-xs text-slate-400 select-none">
                    <button
                      disabled={activePresenterSlideIndex === 0}
                      onClick={() => {
                        setActivePresenterSlideIndex(prev => prev - 1);
                        if (presenterIsPlaying) playPresenterSlide(activePresenterSlideIndex - 1);
                      }}
                      className="p-1 hover:bg-slate-800 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-mono font-bold text-slate-300">
                      Slide {activePresenterSlideIndex + 1} of {presenterSlides.length}
                    </span>
                    <button
                      disabled={activePresenterSlideIndex === presenterSlides.length - 1}
                      onClick={() => {
                        setActivePresenterSlideIndex(prev => prev + 1);
                        if (presenterIsPlaying) playPresenterSlide(activePresenterSlideIndex + 1);
                      }}
                      className="p-1 hover:bg-slate-800 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                </div>

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
                          <img src={img.data || undefined} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
