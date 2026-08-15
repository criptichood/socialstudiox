import React, { useState, useRef, useEffect } from 'react';
import {
  GeneratedImage,
  Project,
  VideoModelInfo,
  VideoAspectRatio,
  VideoResolution,
  VideoDuration,
  DEFAULT_VIDEO_MODEL,
  VIDEO_MODEL_CATALOG,
  VIDEO_ASPECT_RATIOS,
  VIDEO_RESOLUTIONS,
  VIDEO_DURATIONS,
  OMNI_FLASH_MODEL
} from '@/types';
import { DBService } from '@/services/dbService';
import { loadModelSettings, getEnabledModelIds } from '@/services/ai/modelService';
import { fetchVideoModelCatalog } from '@/services/geminiService';
import {
  getVideoGenerationState,
  subscribeVideoGeneration,
  startVideoGenerationJob,
  loadGeneratedVideos
} from '@/services/videoGenerationManager';
import type { GeneratedVideo } from '@/services/videoGenerationManager';
import { VideoModelBehavior } from '@/components/VideoModelBehavior';
import JSZip from 'jszip';
import { 
  Film, 
  Play, 
  Download, 
  Loader2, 
  Wand2, 
  Image as ImageIcon,
  Trash2, 
  Plus, 
  X, 
  ChevronLeft, 
  Upload, 
  Sliders, 
  Check, 
  AlertCircle, 
  Eye,
  Video,
  Copy,
  Scissors,
  Layers,
  ListOrdered,
  Users,
  Pencil,
  RefreshCw,
  Maximize2
} from 'lucide-react';


interface VideoStudioProps {
  images: GeneratedImage[];
  activeProjectId?: string | null;
  projects?: Project[];
  onBackToDashboard?: () => void;
  initialPrompt?: string;
  onSelectProject?: (id: string | null) => void;
}

interface VideoSegment {
  index: number;
  title: string;
  estimatedSeconds: number;
  prompt: string;
  editable?: boolean;
  refined?: boolean;
  assetId?: string | null;
}

interface CharacterAsset {
  id: string;
  name: string;
  role: string;
  description: string;
  tags: string[];
  image: string;
  prompt?: string;
  createdAt?: number;
  source?: 'ai' | 'upload';
}

interface PersistedCascade {
  cascadeId: string;
  segments: VideoSegment[];
  generatedSegments: number[];
  assets?: CharacterAsset[];
}

const CASCADE_STORAGE_KEY = 'social_studio_x_active_cascade_v1';

export const VideoStudio: React.FC<VideoStudioProps> = ({
  images,
  activeProjectId,
  projects,
  onBackToDashboard,
  initialPrompt,
  onSelectProject
}) => {
  // Input states
  const [prompt, setPrompt] = useState(initialPrompt || '');

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [selectedModel, setSelectedModel] = useState<string>(() => loadModelSettings().video || DEFAULT_VIDEO_MODEL);
  const [videoResolution, setVideoResolution] = useState<VideoResolution>('720p');
  const [durationSeconds, setDurationSeconds] = useState<VideoDuration>(6);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [endImageBase64, setEndImageBase64] = useState<string | null>(null);
  const [endImageName, setEndImageName] = useState<string | null>(null);
  
  // Reference Image sources (multi-image capable)
  const [referenceImages, setReferenceImages] = useState<{ data: string; name: string }[]>([]);

  // Model catalog fetched from the server registry (fallback to the shared catalog)
  const [modelCatalog, setModelCatalog] = useState<VideoModelInfo[]>(VIDEO_MODEL_CATALOG);
  const enabledVideoIds = getEnabledModelIds('video');
  const curatedModelCatalog = modelCatalog.filter(m => enabledVideoIds.includes(m.id));
  const [gatewayConfigured, setGatewayConfigured] = useState(true);

  // Drag and drop / UI states
  const [isDragging, setIsDragging] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Generation progress is owned by the global manager so it survives navigation away.
  const [videoGenState, setVideoGenState] = useState(getVideoGenerationState);
  useEffect(() => subscribeVideoGeneration(setVideoGenState), []);
  const isGenerating = videoGenState.status === 'running';
  const generationStep = videoGenState.step;
  const generationProgress = videoGenState.progress;

  // Active playing video & vault
  const [activePreviewVideo, setActivePreviewVideo] = useState<GeneratedVideo | null>(null);
  const [savedVideos, setSavedVideos] = useState<GeneratedVideo[]>([]);
  const [isVideoVaultLoaded, setIsVideoVaultLoaded] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPreviewPrompt, setShowPreviewPrompt] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Cascade / segmented generation
  const [segments, setSegments] = useState<VideoSegment[] | null>(null);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [cascadeId, setCascadeId] = useState<string | null>(null);
  const [generatedSegments, setGeneratedSegments] = useState<number[]>([]);
  const [generatingSegmentIndex, setGeneratingSegmentIndex] = useState<number | null>(null);
  const [queuedSegments, setQueuedSegments] = useState<number[]>([]);
  const [expandedSegmentId, setExpandedSegmentId] = useState<number | null>(null);
  const [refiningSegmentIndex, setRefiningSegmentIndex] = useState<number | null>(null);
  const [assets, setAssets] = useState<CharacterAsset[]>([]);
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
  const [assetEditingId, setAssetEditingId] = useState<string | null>(null);
  const [editingAssetName, setEditingAssetName] = useState('');
  const [assetViewing, setAssetViewing] = useState<CharacterAsset | null>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const segmentQueueRef = useRef<number[]>([]);
  const generatedSegmentsRef = useRef<number[]>([]);
  const segmentsRef = useRef<VideoSegment[] | null>(null);
  const assetsRef = useRef<CharacterAsset[]>([]);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { assetsRef.current = assets; }, [assets]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOmni = selectedModel === OMNI_FLASH_MODEL;
  const selectedSpec: VideoModelInfo | undefined =
    modelCatalog.find(m => m.id === selectedModel) ??
    VIDEO_MODEL_CATALOG.find(m => m.id === selectedModel);
  const isGatewayModel = selectedSpec?.backend === 'gateway';
  const isImageInput = (selectedSpec?.imageInput ?? 'single') !== 'none';
  const isMultiImage = (selectedSpec?.imageInput ?? 'single') === 'multiple';
  const supportsEndFrame = Boolean(selectedSpec?.endFrame);
  const supportsAudio = Boolean(selectedSpec?.audio);
  const audioLocked = Boolean(selectedSpec?.audioLocked) || selectedSpec?.backend === 'gemini';
  const supportsNegativePrompt = selectedSpec?.backend === 'gemini' && !isOmni;
  const validSegmentDurations = ((selectedSpec?.durations as number[]) || [8]).slice().sort((a, b) => a - b);
  const cascadeMaxDuration = Math.max(...validSegmentDurations) as VideoDuration;

  // Snap an estimated seconds value to a valid model duration (Veo only accepts 4/6/8, etc).
  const snapToValidDuration = (estimated: number | undefined | null): VideoDuration => {
    const target = estimated && estimated > 0 ? estimated : cascadeMaxDuration;
    const next = validSegmentDurations.find(d => d >= target);
    const snapped = next ?? validSegmentDurations[validSegmentDurations.length - 1];
    return snapped as VideoDuration;
  };

  const mainCharacterAsset = assets.find(a => a.role === 'main') || assets[0] || null;

  const activeProject = projects?.find(p => p.id === activeProjectId);
  const currentProjectImages = images.filter(img => !activeProjectId || img.id.startsWith(activeProjectId) || activeProjectId === 'global');

  // Load saved videos from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    const loadFromIndexedDB = async () => {
      try {
        const stored = await loadGeneratedVideos();
        if (isMounted) {
          setSavedVideos(stored || []);
          setIsVideoVaultLoaded(true);
        }
      } catch (e) {
        console.error("Failed to load videos from IndexedDB:", e);
        if (isMounted) setIsVideoVaultLoaded(true);
      }
    };
    loadFromIndexedDB();

    DBService.getItem<PersistedCascade | null>(CASCADE_STORAGE_KEY, null)
      .then((cascade) => {
        if (!isMounted || !cascade || !Array.isArray(cascade.segments) || cascade.segments.length === 0) return;
        setCascadeId(cascade.cascadeId);
        segmentsRef.current = cascade.segments;
        setSegments(cascade.segments);
        if (Array.isArray(cascade.assets)) {
          assetsRef.current = cascade.assets;
          setAssets(cascade.assets);
        }
        generatedSegmentsRef.current = cascade.generatedSegments || [];
        setGeneratedSegments(cascade.generatedSegments || []);
      })
      .catch((e) => console.warn("Failed to load active cascade:", e));

    return () => { isMounted = false; };
  }, []);

  // Load the server-side model catalog (registry is the source of truth).
  useEffect(() => {
    let isMounted = true;
    fetchVideoModelCatalog()
      .then(({ models, gatewayConfigured: configured }) => {
        if (!isMounted) return;
        if (models?.length) setModelCatalog(models);
        setGatewayConfigured(configured);
      })
      .catch((e) => {
        console.warn("Failed to load video model catalog; using static fallback", e);
      });
    return () => { isMounted = false; };
  }, []);

  // Clamp resolution/duration/aspect when switching to a model that doesn't support the current values.
  useEffect(() => {
    const spec = modelCatalog.find(m => m.id === selectedModel);
    if (!spec) return;
    setVideoResolution(prev => spec.resolutions.includes(prev) ? prev : (spec.resolutions[0] ?? '720p'));
    setDurationSeconds(prev => (spec.durations as VideoDuration[]).includes(prev) ? prev : ((spec.durations[0] as VideoDuration) ?? 6));
    setAspectRatio(prev => spec.aspectRatios.includes(prev) ? prev : (spec.aspectRatios[0] ?? '16:9'));
    if (spec.imageInput === 'none') {
      setReferenceImages([]);
      setEndImageBase64(null);
    }
    if (!spec.endFrame) setEndImageBase64(null);
  }, [selectedModel, modelCatalog]);

  // Sync to IndexedDB on change
  const saveVideosToStorage = (updatedList: GeneratedVideo[]) => {
    setSavedVideos(updatedList);
    DBService.setItem('social_studio_x_generated_videos_v1', updatedList).catch(err => {
      console.error("Failed to save videos to IndexedDB:", err);
    });
  };

  // Persist the active cascade so it survives navigation and refresh.
  const persistCascade = (cid: string, segList: VideoSegment[] | null, genList: number[]) => {
    if (!cid || !segList || segList.length === 0) return;
    DBService.setItem(CASCADE_STORAGE_KEY, {
      cascadeId: cid,
      segments: segList,
      generatedSegments: genList,
      assets: assetsRef.current
    }).catch(err => console.warn("Failed to persist cascade:", err));
  };

  const commitSegments = (next: VideoSegment[]) => {
    segmentsRef.current = next;
    setSegments(next);
    if (cascadeId) persistCascade(cascadeId, next, generatedSegmentsRef.current);
  };

  // Enhance prompt with Gemini model
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError("Please write a simple description first so AI can expand it.");
      return;
    }
    setError(null);
    setIsEnhancing(true);
    try {
      const response = await fetch("/api/video/enhance-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Enhance failed");
      }

      const res = await response.json();
      if (res && res.text) {
        setPrompt(res.text.trim());
        setSuccessMessage("Prompt enhanced with cinematic keywords!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (e) {
      console.error("Enhance failed", e);
      setError("Failed to enhance prompt. Check your connection or API key.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Convert File to Base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (PNG, JPEG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      addReferenceImages([{ data: e.target?.result as string, name: file.name }]);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Add reference images — single-image models replace the current one; multi-image models append.
  const addReferenceImages = (images: { data: string; name: string }[]) => {
    if (images.length === 0) return;
    setReferenceImages(prev => {
      if (isMultiImage) return [...prev, ...images];
      return images;
    });
  };

  // Convert File to Base64 for the end frame (lastFrame)
  const processEndImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (PNG, JPEG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setEndImageBase64(e.target?.result as string);
      setEndImageName(file.name);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read end frame image file.");
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processImageFile);
    }
  };

  // Video Generation trigger — delegated to the global manager so it survives navigation away.
  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setError("Please enter a video description prompt.");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    if (isGatewayModel && !gatewayConfigured) {
      setError("AI Gateway is not configured. Add AI_GATEWAY_API_KEY to your .env.local to use gateway models.");
      return;
    }

    const refImageBase64 = referenceImages.length > 0 ? referenceImages[0].data : undefined;

    try {
      const video = await startVideoGenerationJob({
        prompt,
        refImageBase64,
        aspectRatio,
        model: selectedModel,
        resolution: videoResolution,
        durationSeconds,
        endImageBase64: endImageBase64 || undefined,
        negativePrompt: supportsNegativePrompt ? (negativePrompt || undefined) : undefined,
        generateAudio: audioLocked ? undefined : generateAudio,
        referenceImages: referenceImages.map(r => r.data),
        projectId: activeProjectId || 'global'
      });

      setSavedVideos(prev => [video, ...prev]);
      setActivePreviewVideo(video);
      setSuccessMessage("AI Video generated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      // Generation failures surface as a global toast via the manager state.
      console.error("Video generation failed:", err);
    }
  };

  const handleDeleteVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedVideos.filter(v => v.id !== id);
    saveVideosToStorage(filtered);
    if (activePreviewVideo?.id === id) {
      setActivePreviewVideo(null);
    }
    setDeleteConfirmId(null);
  };

  const handleDownloadVideo = (video: GeneratedVideo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = video.videoUrl;
    const a = document.createElement('a');
    a.download = `video-generation-${video.id}.mp4`;

    if (url.startsWith('data:')) {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        })
        .catch(err => console.error("Failed to download video:", err));
    } else {
      // External URL (e.g. a hosted render) — open in a new tab.
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleCopyVideoPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // Analyze the full prompt and split it into character-consistent, duration-limited segments.
  const handleSegmentPrompt = async () => {
    if (!prompt.trim()) {
      setError("Please write a video description first so AI can split it into segments.");
      return;
    }
    setError(null);
    setIsSegmenting(true);
    try {
      const response = await fetch("/api/video/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, maxDurationSeconds: cascadeMaxDuration })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Segmentation failed");
      }
      const res = await response.json();
      if (!res.segments || res.segments.length === 0) {
        throw new Error("No segments were returned");
      }
      const newCascadeId = `cascade-${Date.now()}`;
      const firstAsset = assetsRef.current.find(a => a.role === 'main') || assetsRef.current[0] || null;
      const sortedSegments: VideoSegment[] = [...res.segments].sort((a, b) => a.index - b.index).map(s => ({
        ...s,
        editable: false,
        refined: true,
        assetId: firstAsset ? firstAsset.id : null
      }));
      setCascadeId(newCascadeId);
      segmentsRef.current = sortedSegments;
      setSegments(sortedSegments);
      generatedSegmentsRef.current = [];
      setGeneratedSegments([]);
      setExpandedSegmentId(null);
      segmentQueueRef.current = [];
      setQueuedSegments([]);
      persistCascade(newCascadeId, sortedSegments, []);
      setSuccessMessage(`Split into ${sortedSegments.length} segments (~${res.totalSeconds}s total). Generate them in order for consistency.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      console.error("Segmentation failed", e);
      setError(`Failed to split prompt into segments: ${e?.message || "check API key"}`);
    } finally {
      setIsSegmenting(false);
    }
  };

  // Generate a single segment's video with full character-consistency anchors preserved.
  const finishQueue = () => {
    const next = segmentQueueRef.current.shift();
    setQueuedSegments([...segmentQueueRef.current]);
    if (next !== undefined) {
      setTimeout(() => runSegment(next), 400);
    }
  };

  const runSegment = async (index: number) => {
    const seg = segmentsRef.current?.[index];
    if (!seg) return;
    setGeneratingSegmentIndex(index);
    setError(null);
    try {
      let targetPrompt = seg.prompt;
      // User-authored parts are refined as a continuation of the previous part first.
      if (seg.editable && !seg.refined) {
        const ok = await handleRefineSegment(index);
        if (!ok) { setGeneratingSegmentIndex(null); finishQueue(); return; }
        targetPrompt = segmentsRef.current?.[index]?.prompt || seg.prompt;
      }
      // Pass the assigned character asset as the first frame so the same character is preserved.
      const segForRef = segmentsRef.current?.[index];
      const assignedAsset = segForRef?.assetId
        ? assetsRef.current.find(a => a.id === segForRef.assetId)
        : null;
      const assetRef = isImageInput && assignedAsset?.image ? assignedAsset.image : null;
      const userRefs = referenceImages.map(r => r.data);
      const refList = assetRef ? [assetRef, ...userRefs] : userRefs;
      const video = await startVideoGenerationJob({
        prompt: targetPrompt,
        refImageBase64: assetRef ?? (userRefs[0] || undefined),
        aspectRatio,
        model: selectedModel,
        resolution: videoResolution,
        durationSeconds: snapToValidDuration(seg.estimatedSeconds),
        endImageBase64: endImageBase64 || undefined,
        negativePrompt: supportsNegativePrompt ? (negativePrompt || undefined) : undefined,
        generateAudio: audioLocked ? undefined : generateAudio,
        referenceImages: refList,
        projectId: activeProjectId || 'global',
        cascadeId: cascadeId || undefined,
        segmentIndex: index + 1,
        assetId: assignedAsset?.id || undefined
      });
      setSavedVideos(prev => {
        const next = [video, ...prev.filter(v => !(cascadeId && v.cascadeId === cascadeId && v.segmentIndex === index + 1))];
        saveVideosToStorage(next);
        return next;
      });
      setActivePreviewVideo(video);
      const nextGenerated = generatedSegmentsRef.current.includes(index)
        ? generatedSegmentsRef.current
        : [...generatedSegmentsRef.current, index];
      generatedSegmentsRef.current = nextGenerated;
      setGeneratedSegments(nextGenerated);
      if (cascadeId) persistCascade(cascadeId, segmentsRef.current, nextGenerated);
      setSuccessMessage(`Segment ${index + 1} of ${segmentsRef.current?.length} generated!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Segment generation failed:", err);
    } finally {
      setGeneratingSegmentIndex(null);
      finishQueue();
    }
  };

  const handleGenerateSegment = (index: number) => {
    if (videoGenState.status === 'running' || generatingSegmentIndex !== null) {
      setError("A video is already generating. Wait for it to finish before starting the next segment.");
      return;
    }
    setError(null);
    runSegment(index);
  };

  const handleGenerateAllSegments = () => {
    if (!segments || segments.length === 0) return;
    if (videoGenState.status === 'running' || generatingSegmentIndex !== null) {
      setError("A video is already generating. Wait for it to finish before starting the queue.");
      return;
    }
    setError(null);
    const pending = segments.map((_, i) => i).filter(i => !generatedSegments.includes(i));
    if (pending.length === 0) {
      setSuccessMessage("All segments have already been generated.");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    segmentQueueRef.current = pending.slice(1);
    setQueuedSegments([...segmentQueueRef.current]);
    runSegment(pending[0]);
  };

  const handleClearCascade = () => {
    segmentQueueRef.current = [];
    generatedSegmentsRef.current = [];
    segmentsRef.current = null;
    assetsRef.current = [];
    setQueuedSegments([]);
    setSegments(null);
    setCascadeId(null);
    setGeneratedSegments([]);
    setGeneratingSegmentIndex(null);
    setExpandedSegmentId(null);
    setAssets([]);
    DBService.removeItem(CASCADE_STORAGE_KEY).catch(() => {});
  };

  // Add a new user-authored part at the end of the storyboard.
  const handleAddSegment = () => {
    if (!segments) return;
    const newSegment: VideoSegment = {
      index: segments.length + 1,
      title: `Part ${segments.length + 1}`,
      estimatedSeconds: cascadeMaxDuration,
      prompt: "",
      editable: true,
      refined: false
    };
    commitSegments([...segments, newSegment]);
    setExpandedSegmentId(segments.length);
    setSuccessMessage("New part added — type the content, refine it as a continuation, then generate.");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Delete a part and renumber the rest.
  const handleDeleteSegment = (index: number) => {
    if (!segments) return;
    const next = segments.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i + 1 }));
    segmentQueueRef.current = segmentQueueRef.current.filter(q => q !== index).map(q => (q > index ? q - 1 : q));
    const genNext = generatedSegmentsRef.current.filter(g => g !== index).map(g => (g > index ? g - 1 : g));
    generatedSegmentsRef.current = genNext;
    setQueuedSegments([...segmentQueueRef.current]);
    setGeneratedSegments(genNext);
    if (generatingSegmentIndex === index) setGeneratingSegmentIndex(null);
    setExpandedSegmentId(prev => (prev === index ? null : prev === null ? null : prev > index ? prev - 1 : prev));
    commitSegments(next);
    if (next.length === 0) {
      setCascadeId(null);
      setSegments(null);
      DBService.removeItem(CASCADE_STORAGE_KEY).catch(() => {});
    }
  };

  // Edit a user-authored part (mark as needing refinement once the prompt changes).
  const handleEditSegment = (index: number, patch: Partial<VideoSegment>) => {
    if (!segments) return;
    const next = segments.map((s, i) => (i === index ? { ...s, ...patch, refined: patch.prompt !== undefined ? false : s.refined } : s));
    commitSegments(next);
  };

  // Ask AI to turn raw content into a continuation of the previous part (same character/voice).
  const handleRefineSegment = async (index: number): Promise<boolean> => {
    const current = segmentsRef.current;
    if (!current) return false;
    const seg = current[index];
    if (!seg) return false;
    if (!seg.prompt.trim()) {
      setError("Type some content first so AI can refine it as a continuation.");
      return false;
    }
    setError(null);
    setRefiningSegmentIndex(index);
    try {
      const prevPrompt = index > 0 ? (current[index - 1]?.prompt || "") : "";
      const response = await fetch("/api/video/segment/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastSegmentPrompt: prevPrompt, content: seg.prompt, maxDurationSeconds: cascadeMaxDuration })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Continuation refinement failed");
      }
      const res = await response.json();
      const next = current.map((s, i) =>
        i === index
          ? { ...s, prompt: res.prompt, title: res.title || s.title, estimatedSeconds: res.estimatedSeconds || s.estimatedSeconds, refined: true }
          : s
      );
      commitSegments(next);
      setExpandedSegmentId(index);
      setSuccessMessage(`Part ${index + 1} refined as a continuation of the story.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      return true;
    } catch (e: any) {
      console.error("Continuation refinement failed", e);
      setError(`Failed to refine: ${e?.message || "check API key"}`);
      return false;
    } finally {
      setRefiningSegmentIndex(null);
    }
  };

  // Analyze the prompt and generate character reference assets (face, clothing, environment).
  const handleGenerateAssets = async () => {
    if (!prompt.trim()) {
      setError("Write a video description first so AI can extract the characters.");
      return;
    }
    setError(null);
    setIsGeneratingAssets(true);
    try {
      const response = await fetch("/api/video/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Asset generation failed");
      }
      const res = await response.json();
      if (!res.assets || res.assets.length === 0) {
        throw new Error("No character assets returned");
      }
      const newAssets: CharacterAsset[] = res.assets.map((a: any, i: number) => ({
        id: a.id || `asset-${Date.now()}-${i}`,
        name: a.name || `Character ${i + 1}`,
        role: a.role || 'supporting',
        description: a.description || '',
        tags: Array.isArray(a.tags) ? a.tags : [],
        image: a.image,
        prompt: a.imagePrompt || a.prompt || '',
        createdAt: Date.now()
      }));
      assetsRef.current = newAssets;
      setAssets(newAssets);
      const firstAsset = newAssets.find(a => a.role === 'main') || newAssets[0];
      if (firstAsset && segmentsRef.current) {
        const next = segmentsRef.current.map(s => (s.assetId ? s : { ...s, assetId: firstAsset.id }));
        segmentsRef.current = next;
        setSegments(next);
      }
      if (cascadeId) persistCascade(cascadeId, segmentsRef.current, generatedSegmentsRef.current);
      setSuccessMessage(`Generated ${newAssets.length} character asset${newAssets.length > 1 ? 's' : ''}. The main character is applied to all parts by default.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      console.error("Asset generation failed", e);
      setError(`Failed to generate character assets: ${e?.message || "check API key"}`);
    } finally {
      setIsGeneratingAssets(false);
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    const nextAssets = assetsRef.current.filter(a => a.id !== assetId);
    assetsRef.current = nextAssets;
    setAssets(nextAssets);
    if (segmentsRef.current) {
      const nextSegments = segmentsRef.current.map(s => (s.assetId === assetId ? { ...s, assetId: null } : s));
      segmentsRef.current = nextSegments;
      setSegments(nextSegments);
      if (cascadeId) persistCascade(cascadeId, nextSegments, generatedSegmentsRef.current);
    }
  };

  const handleAssignAssetToSegment = (index: number, assetId: string) => {
    if (!segmentsRef.current) return;
    const next = segmentsRef.current.map((s, i) => (i === index ? { ...s, assetId: assetId || null } : s));
    segmentsRef.current = next;
    setSegments(next);
    if (cascadeId) persistCascade(cascadeId, next, generatedSegmentsRef.current);
  };

  // Import user-provided character assets (base64 images) into the library.
  const processAssetFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError("Please upload image files (PNG, JPEG, WebP).");
      return;
    }
    setError(null);
    const hasMain = assetsRef.current.some(a => a.role === 'main');
    let added = 0;
    let read = 0;
    imageFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        read++;
        const dataUrl = reader.result as string;
        if (!dataUrl) return;
        const asset: CharacterAsset = {
          id: `asset-upload-${Date.now()}-${idx}`,
          name: file.name.replace(/\.[^.]+$/, '') || `Uploaded Character ${assetsRef.current.length + 1}`,
          role: !hasMain && added === 0 ? 'main' : 'supporting',
          description: '',
          tags: [],
          image: dataUrl,
          createdAt: Date.now(),
          source: 'upload'
        };
        added++;
        assetsRef.current = [...assetsRef.current, asset];
        setAssets(assetsRef.current);
        if (cascadeId) persistCascade(cascadeId, segmentsRef.current, generatedSegmentsRef.current);
        if (read === imageFiles.length && added > 0) {
          setSuccessMessage(`Imported ${added} character asset${added > 1 ? 's' : ''}. Assign them to parts via each segment's Character selector.`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      };
      reader.onerror = () => {
        read++;
        setError("Failed to read one of the uploaded images.");
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRenameAsset = (id: string) => {
    const name = editingAssetName.trim();
    if (!name) { setAssetEditingId(null); return; }
    const next = assetsRef.current.map(a => (a.id === id ? { ...a, name } : a));
    assetsRef.current = next;
    setAssets(next);
    setAssetEditingId(null);
    if (cascadeId) persistCascade(cascadeId, segmentsRef.current, generatedSegmentsRef.current);
  };

  const handleSetMainAsset = (id: string) => {
    const next = assetsRef.current.map(a => (a.id === id ? { ...a, role: 'main' } : a.role === 'main' ? { ...a, role: 'supporting' } : a));
    assetsRef.current = next;
    setAssets(next);
    if (cascadeId) persistCascade(cascadeId, segmentsRef.current, generatedSegmentsRef.current);
  };

  const assetFileName = (asset: CharacterAsset) => {
    const safe = (asset.name || 'character').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'character';
    const mime = asset.image.match(/^data:([^;]+);/)?.[1] || 'image/png';
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
    return `${safe}.${ext}`;
  };

  const downloadAssetImage = (asset: CharacterAsset) => {
    const a = document.createElement('a');
    a.href = asset.image;
    a.download = assetFileName(asset);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadAllAssets = async () => {
    const list = assetsRef.current;
    if (list.length === 0) return;
    setError(null);
    try {
      const zip = new JSZip();
      const folder = zip.folder('characters');
      const manifest: { name: string; role: string; description: string; tags: string[]; prompt: string; source: string; file: string }[] = [];
      list.forEach((asset) => {
        const fileName = assetFileName(asset);
        const base64 = asset.image.replace(/^data:image\/[^;]+;base64,/, '');
        folder?.file(fileName, base64, { base64: true });
        manifest.push({
          name: asset.name,
          role: asset.role,
          description: asset.description,
          tags: asset.tags,
          prompt: asset.prompt || '',
          source: asset.source || 'ai',
          file: fileName
        });
      });
      folder?.file('characters.json', JSON.stringify(manifest, null, 2));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `character-library-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccessMessage(`Downloaded ${list.length} character asset${list.length > 1 ? 's' : ''} as a ZIP (with characters.json manifest).`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      console.error("ZIP export failed", e);
      setError(`Failed to download assets: ${e?.message || "unknown error"}`);
    }
  };

  const handleCopyAssetPrompt = (asset: CharacterAsset) => {
    if (!asset.prompt) return;
    navigator.clipboard.writeText(asset.prompt).then(() => {
      setCopiedPromptId(`asset-${asset.id}`);
      setTimeout(() => setCopiedPromptId(null), 2000);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!assetViewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAssetViewing(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [assetViewing]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="video-studio-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <button
            onClick={onBackToDashboard}
            className="group flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-semibold"
            id="btn-video-back"
          >
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Projects Space</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Film className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <h1 className="text-xl font-display font-bold text-white tracking-wide" id="video-studio-title">
              Video Generation Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Create high-fidelity cinematic video loops from reference frames or narrative descriptions using native <span className="text-indigo-400 font-bold">Veo 3.1</span> and <span className="text-cyan-400 font-bold">Gemini Omni</span> models.
          </p>
        </div>

        {onSelectProject && projects && projects.length > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-800 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse animate-pulse shrink-0"></span>
            <span className="text-xs text-slate-400 font-medium font-mono hidden sm:inline">Workspace:</span>
            <select
              value={activeProjectId || ''}
              onChange={(e) => onSelectProject(e.target.value || null)}
              className="text-xs font-semibold px-2 py-0.5 bg-transparent border-none outline-none text-slate-200 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">Standalone Space</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.name}</option>
              ))}
            </select>
          </div>
        ) : activeProject ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-800 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
            <span className="text-xs text-slate-300 font-medium font-mono">Project: {activeProject.name}</span>
          </div>
        ) : null}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Input Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto pr-1.5 scrollbar-thin">
          
          {/* Section: Directives Input */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video Prompt</span>
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim() || isGenerating}
                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase rounded-lg tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                title="Use Gemini to rewrite the prompt with cinematic detail"
                id="btn-enhance-prompt"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3 text-cyan-400" />
                )}
                <span>Enhance with AI</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the action, camera movement, and aesthetic (e.g. 'A slow cinematic tracking shot moving through a futuristic cyberpunk research lab, neon indicators flashing, volumetric haze, 4k render')"
                className="w-full h-32 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none font-medium leading-relaxed"
                disabled={isGenerating}
                id="input-video-prompt"
              />
              <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-500 font-mono">
                {prompt.length} chars
              </div>
            </div>

            {/* Quick Suggestions list */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Need inspiration?</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Cyberpunk Lab", prompt: "Cinematic camera drift through a neon cyberpunk server farm, fiber-optic cables pulsing with cyan light, volumetric particle haze, hyperrealistic." },
                  { label: "Winter Forest", prompt: "An aerial slow drone shot gliding over a snowy forest during winter sunset, warm orange light illuminating the evergreen pine trees." },
                  { label: "Tech Board", prompt: "A macro detailed camera tracking shot along a futuristic dark glass motherboard with glowing gold electrical pathways." }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s.prompt)}
                    disabled={isGenerating}
                    className="px-2 py-1 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-semibold rounded-lg transition-colors border border-transparent hover:border-slate-700/50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Image Reference & Specs */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            
            {isImageInput && (
              <>
              {/* Reference Image Drag/Drop */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isMultiImage ? 'Reference Images (Multi-image)' : 'Reference Frame (Image-to-Video)'}</span>
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple={isMultiImage}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      Array.from(files).forEach(processImageFile);
                    }
                    e.target.value = '';
                  }}
                  accept="image/*"
                  className="hidden"
                />

                {isMultiImage && referenceImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {referenceImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 group">
                        <img src={img.data || undefined} alt={`Reference ${idx + 1}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReferenceImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 p-0.5 bg-slate-900/90 hover:bg-red-600 text-slate-300 hover:text-white rounded-full transition-colors border border-white/10"
                          title="Remove reference"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/30 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-400 transition-all cursor-pointer"
                      title="Add reference image"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase">Add</span>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={dragRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                    }`}
                    id="dropzone-ref-frame"
                  >
                    {!isMultiImage && referenceImages.length > 0 ? (
                      <div className="relative group w-full max-h-36 overflow-hidden rounded-lg flex items-center justify-center bg-slate-950">
                        <img 
                          src={referenceImages[0].data || undefined} 
                          alt="Uploaded reference" 
                          className="object-contain max-h-36 w-full"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shadow transition-transform transform scale-90 group-hover:scale-100">
                            <Trash2 className="w-3 h-3" />
                            <span>Remove image</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReferenceImages([]);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition-colors border border-white/10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-1.5">
                        <div className="mx-auto w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-300 font-bold">{isMultiImage ? 'Drag reference images here' : 'Drag reference frame here'}</p>
                          <p className="text-[10px] text-slate-500">or click to browse local files</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Import from Recent project assets */}
              {currentProjectImages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Or import from recent project images</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {currentProjectImages.slice(0, 4).map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          addReferenceImages([{ data: img.data, name: img.prompt }]);
                          setError(null);
                        }}
                        className="relative h-12 rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500/50 bg-slate-950/50 transition-all flex items-center justify-center cursor-pointer group"
                        title={img.prompt}
                      >
                        <img src={img.data || undefined} alt="Quick pick" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </>
            )}

            {/* Model & Aspect ratio config */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Model Engine</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all font-semibold"
                  disabled={isGenerating}
                  id="select-video-model"
                >
                  {curatedModelCatalog.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      disabled={m.backend === 'gateway' && !gatewayConfigured}
                    >
                      {m.label}{m.backend === 'gateway' ? ' (Gateway)' : ''}{m.backend === 'gateway' && !gatewayConfigured ? ' — needs key' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Aspect Ratio</span>
                <div className="flex gap-1" id="aspect-ratio-selector">
                  {(selectedSpec?.aspectRatios ?? VIDEO_ASPECT_RATIOS).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resolution & Duration config */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Resolution</span>
                <div className="flex gap-1" id="resolution-selector">
                  {(selectedSpec?.resolutions ?? VIDEO_RESOLUTIONS).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setVideoResolution(res)}
                      disabled={(selectedSpec?.resolutions ?? VIDEO_RESOLUTIONS).length <= 1 || isGenerating}
                      title={(selectedSpec?.resolutions ?? VIDEO_RESOLUTIONS).length <= 1 ? `${selectedSpec?.label} outputs ${res} only` : ''}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-mono transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        videoResolution === res
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Duration</span>
                <div className="flex gap-1" id="duration-selector">
                  {((selectedSpec?.durations ?? [...VIDEO_DURATIONS]) as VideoDuration[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationSeconds(d)}
                      disabled={isGenerating}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                        durationSeconds === d
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Native Audio toggle */}
            {supportsAudio && (
              <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Native Audio</span>
                  <p className="text-[9px] text-slate-600">{audioLocked ? 'Always generated by this model' : 'Synchronized sound effects & ambience'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGenerateAudio(v => !v)}
                  disabled={audioLocked || isGenerating}
                  title={audioLocked ? 'This model always generates audio' : ''}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${generateAudio ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  id="toggle-video-audio"
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${generateAudio ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
                </button>
              </div>
            )}

            {/* Negative Prompt */}
            {supportsNegativePrompt && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Negative Prompt <span className="text-slate-600 normal-case">(optional)</span></span>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="e.g. blurry, low quality, distorted, watermark"
                  disabled={isGenerating}
                  className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  id="input-negative-prompt"
                />
              </div>
            )}

            {/* Primary Generate Action */}
            <div className="space-y-2 pt-1.5">
              {error && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !prompt.trim()}
                className="group w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-indigo-900/30 ring-1 ring-inset ring-white/20 hover:ring-white/30 border border-indigo-400/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:scale-[0.99] hover:-translate-y-0.5"
                id="btn-generate-video-action"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                ) : (
                  <Video className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                )}
                <span>{isGenerating ? 'Generating Video...' : 'Generate Video'}</span>
              </button>

              <button
                onClick={handleSegmentPrompt}
                disabled={isSegmenting || !prompt.trim() || isGenerating || generatingSegmentIndex !== null}
                className="w-full py-2.5 bg-slate-800/60 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 text-xs font-bold tracking-wide rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-segment-prompt"
                title="Break a long prompt into multiple character-consistent, duration-limited segments"
              >
                {isSegmenting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Scissors className="w-3.5 h-3.5" />
                )}
                <span>{isSegmenting ? 'Analyzing & Splitting...' : segments ? `Re-split into Segments (${segments.length})` : `Split into Segments (max ${cascadeMaxDuration}s each)`}</span>
              </button>

              <button
                onClick={handleGenerateAssets}
                disabled={isGeneratingAssets || !prompt.trim() || isGenerating || generatingSegmentIndex !== null}
                className="w-full py-2.5 bg-slate-800/60 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-bold tracking-wide rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-generate-assets"
                title="Analyze the prompt and generate character reference assets (face, clothing, environment) used as first frames to keep characters consistent"
              >
                {isGeneratingAssets ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Users className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingAssets ? 'Generating Character Assets...' : assets.length > 0 ? `Re-generate Character Assets (${assets.length})` : 'Generate Character Assets'}</span>
              </button>
            </div>


            {/* End Frame upload (lastFrame) */}
            {supportsEndFrame && (
              <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">End Frame <span className="text-slate-600 normal-case">(optional, image-to-video)</span></span>
              <div
                onClick={() => endFileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all border-slate-800 hover:border-slate-700 bg-slate-950/20"
                id="dropzone-end-frame"
              >
                <input
                  type="file"
                  ref={endFileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processEndImageFile(e.target.files[0]);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                {endImageBase64 ? (
                  <div className="flex items-center gap-2 w-full">
                    <img src={endImageBase64 || undefined} alt="End frame" className="w-14 h-14 object-cover rounded-lg border border-slate-800 bg-slate-950" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[10px] text-slate-300 font-bold truncate">{endImageName || 'End frame attached'}</p>
                      <p className="text-[9px] text-slate-500">Used as the final frame of the video</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEndImageBase64(null);
                        setEndImageName(null);
                      }}
                      className="p-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition-colors border border-white/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Upload className="w-4 h-4" />
                    <span className="text-[10px] font-semibold">Click to attach final frame image</span>
                  </div>
                )}
              </div>
            </div>
            )}

          </div>

          {/* Section: Model Behavior (capability info from the server registry) */}
          {selectedSpec && (
            <VideoModelBehavior
              spec={selectedSpec}
              gatewayConfigured={gatewayConfigured}
              audioLocked={audioLocked}
            />
          )}

        </div>

        {/* Right Column - Active Screen & Archives (7 cols) */}
        <div className="lg:col-span-7 space-y-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto pr-1.5 scrollbar-thin">
          
          {/* Section: Live Cinema Screen */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 md:p-6 overflow-hidden relative min-h-[360px] flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>AI Video Screen</span>
              </span>
              
              {activePreviewVideo && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(activePreviewVideo.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Screen Canvas Area */}
            <div className="flex-1 my-5 flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden min-h-[220px] max-h-[380px] border border-slate-800/60 relative group shadow-inner">
              
              {isGenerating ? (
                // Immersive Loading Frame
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 bg-slate-950/95 animate-pulse" id="video-rendering-loader">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin relative z-10" />
                  </div>
                  <div className="space-y-2 text-center max-w-sm z-10">
                    <p className="text-sm font-bold text-slate-100 font-display">Rendering Video</p>
                    <p className="text-xs text-indigo-400 font-medium font-mono animate-bounce">{generationStep}</p>
                  </div>
                  
                  {/* Progress bar container */}
                  <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 z-10">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">{generationProgress}%</span>
                </div>
              ) : activePreviewVideo ? (
                // Active video layout
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    key={activePreviewVideo.id}
                    src={activePreviewVideo.videoUrl || undefined}
                    controls
                    autoPlay
                    loop
                    className="max-h-[380px] w-auto max-w-full object-contain"
                  />
                  
                  {/* Overlay tags on hover */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-white/10 px-2.5 py-1 rounded-lg text-[9px] font-bold text-cyan-400 uppercase tracking-widest pointer-events-none transition-opacity group-hover:opacity-100 opacity-0 font-mono">
                    {activePreviewVideo.isSimulated ? "Simulated Video" : "Live Render"}
                  </div>
                </div>
              ) : (
                // Empty Screen State
                <div className="text-center p-6 space-y-3">
                  <div className="mx-auto w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 font-bold">No active video compiling</p>
                    <p className="text-[10px] text-slate-500 max-w-xs">Describe an action sequence on the left and hit generate to view the cinematic motion loop output here.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Screen details footer bar */}
            {activePreviewVideo && (
              <div className="pt-3 border-t border-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-200 line-clamp-1">{activePreviewVideo.prompt}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Engine: {activePreviewVideo.model} • {activePreviewVideo.resolution || '720p'} • Ratio: {activePreviewVideo.aspectRatio}{activePreviewVideo.durationSeconds ? ` • ${activePreviewVideo.durationSeconds}s` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreviewPrompt(!showPreviewPrompt)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      showPreviewPrompt
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showPreviewPrompt ? 'Hide Prompt' : 'View Prompt'}</span>
                  </button>
                  <button
                    onClick={() => handleCopyVideoPrompt(activePreviewVideo.id, activePreviewVideo.prompt)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      copiedPromptId === activePreviewVideo.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/50'
                    }`}
                  >
                    {copiedPromptId === activePreviewVideo.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadVideo(activePreviewVideo)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewVideo(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50"
                    title="Close video"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            {showPreviewPrompt && activePreviewVideo && (
              <div className="mt-3 p-4 bg-slate-900 border border-indigo-500/20 rounded-2xl text-left text-xs font-mono text-slate-300 leading-relaxed max-h-[180px] overflow-y-auto break-words animate-in slide-in-from-top-2 duration-200 relative">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Generation Prompt</span>
                  <button
                    onClick={() => handleCopyVideoPrompt(activePreviewVideo.id, activePreviewVideo.prompt)}
                    className={`text-[10px] px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      copiedPromptId === activePreviewVideo.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {copiedPromptId === activePreviewVideo.id ? (
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
                <p>{activePreviewVideo.prompt}</p>
              </div>
            )}

          </div>

          {/* Section: Saved Video Archives (Grid Vault) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Generated Video Archives ({savedVideos.length})</span>
              </span>

              {savedVideos.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear your entire video vault?")) {
                      saveVideosToStorage([]);
                      setActivePreviewVideo(null);
                    }
                  }}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Clear Archive
                </button>
              )}
            </div>

            {savedVideos.length === 0 ? (
              <div className="border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500">
                <p className="text-xs font-medium">Your compiled video vault is currently empty.</p>
                <p className="text-[10px] text-slate-600 mt-1">Generated loop clips will be automatically persisted here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVideos.map((vid) => {
                  const isActive = activePreviewVideo?.id === vid.id;
                  
                  return (
                    <div
                      key={vid.id}
                      onClick={() => setActivePreviewVideo(vid)}
                      className={`group border rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between bg-slate-900/60 relative ${
                        isActive 
                          ? 'border-indigo-500 ring-1 ring-indigo-500/30 shadow-indigo-500/5' 
                          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Video clip display context / thumbnail */}
                      <div className="aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden h-28 border-b border-slate-800/40">
                        {vid.referenceImageUrl ? (
                          <img 
                            src={vid.referenceImageUrl || undefined} 
                            alt="Reference frame" 
                            className="object-cover w-full h-full filter blur-[1px] opacity-70 scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-indigo-950/20"></div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 group-hover:bg-slate-950/50 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-slate-900/90 group-hover:bg-indigo-600 text-slate-200 group-hover:text-white flex items-center justify-center border border-white/10 group-hover:border-indigo-500 shadow-lg transition-all transform group-hover:scale-105">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className="px-1.5 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[8px] font-bold text-slate-400 font-mono uppercase">
                            {vid.aspectRatio}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[8px] font-bold text-slate-400 font-mono uppercase">
                            {vid.resolution || '720p'}{vid.durationSeconds ? ` • ${vid.durationSeconds}s` : ''}
                          </span>
                          {vid.isSimulated && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur rounded text-[8px] font-bold font-mono">
                              Simulated
                            </span>
                          )}
                        </div>

                        {/* Inline Delete overlay */}
                        {deleteConfirmId === vid.id ? (
                          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-3 text-center z-20 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-red-200 font-bold mb-2">Delete permanently?</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={(e) => handleDeleteVideo(vid.id, e)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyVideoPrompt(vid.id, vid.prompt);
                              }}
                              className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 rounded-md border border-white/10 shadow"
                              title="Copy prompt"
                            >
                              {copiedPromptId === vid.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadVideo(vid);
                              }}
                              className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-md border border-white/10 shadow"
                              title="Download MP4"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(vid.id);
                              }}
                              className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-red-400 rounded-md border border-white/10 shadow"
                              title="Delete clip"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Video card text metadata */}
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors">{vid.prompt}</p>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1.5">
                            {vid.cascadeId && vid.segmentIndex ? (
                              <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded text-[8px] font-bold uppercase tracking-wider">
                                Part {vid.segmentIndex}
                              </span>
                            ) : null}
                            <span>{new Date(vid.timestamp).toLocaleDateString()}</span>
                          </span>
                          <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" />
                            <span>Preview</span>
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Production Board: Character Asset Library + Cascade Storyboard */}
      {(assets.length > 0 || (segments && segments.length > 0)) && (
        <div className="space-y-5">
          {/* Character Asset Library */}
          {assets.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Character Asset Library</span>
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Generated reference sheets (face, clothing, environment) in {aspectRatio}. Each part uses an asset as its first frame so the character stays identical. Pick a different asset per part if another character takes over.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={assetFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { processAssetFiles(e.target.files); e.target.value = ''; }}
                  />
                  <button
                    onClick={handleDownloadAllAssets}
                    disabled={assets.length === 0 || isGeneratingAssets}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    title="Download all character assets as a ZIP (with a characters.json manifest)"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download All</span>
                  </button>
                  <button
                    onClick={() => assetFileInputRef.current?.click()}
                    disabled={isGeneratingAssets || isGenerating || generatingSegmentIndex !== null}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    title="Upload your own reference images"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                  <button
                    onClick={handleGenerateAssets}
                    disabled={isGeneratingAssets || !prompt.trim() || isGenerating || generatingSegmentIndex !== null}
                    className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/30 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {isGeneratingAssets ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    <span>Re-generate</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                {assets.map((asset) => (
                  <div key={asset.id} className={`group rounded-2xl overflow-hidden border transition-all bg-slate-900/70 ${mainCharacterAsset?.id === asset.id ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : 'border-slate-800 hover:border-slate-600'}`}>
                    <button
                      onClick={() => setAssetViewing(asset)}
                      className="relative block w-full aspect-[3/4] bg-slate-950 overflow-hidden cursor-zoom-in text-left"
                      title="Click to zoom and view the full prompt"
                    >
                      <img src={asset.image || undefined} alt={asset.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
                        <span className="p-1.5 bg-slate-900/80 backdrop-blur rounded-md border border-white/10 text-slate-200">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSetMainAsset(asset.id); }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider backdrop-blur border transition-colors cursor-pointer ${asset.role === 'main' ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40' : 'bg-slate-900/80 text-slate-300 border-white/15 hover:border-cyan-500/40'}`}
                          title={asset.role === 'main' ? 'Main character (click to unset)' : 'Set as main character'}
                        >
                          {asset.role === 'main' ? 'Main' : 'Supporting'}
                        </button>
                        {mainCharacterAsset?.id === asset.id && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur">Default</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider backdrop-blur border ${asset.source === 'upload' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'}`}>
                          {asset.source === 'upload' ? 'Uploaded' : 'AI'}
                        </span>
                      </div>
                      <span
                        onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}
                        className="absolute top-2 right-2 p-1 bg-slate-900/90 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-md border border-white/10 transition-colors cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    </button>
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {assetEditingId === asset.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              value={editingAssetName}
                              onChange={(e) => setEditingAssetName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameAsset(asset.id); if (e.key === 'Escape') setAssetEditingId(null); }}
                              className="flex-1 w-full min-w-0 bg-slate-950 border border-cyan-500/40 rounded px-1.5 py-0.5 text-[10px] text-slate-200 outline-none"
                              autoFocus
                              placeholder="Name"
                            />
                            <button onClick={() => handleRenameAsset(asset.id)} className="text-emerald-400 hover:text-emerald-300 cursor-pointer" title="Save"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setAssetEditingId(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer" title="Cancel"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] font-bold text-slate-200 truncate flex-1">{asset.name}</p>
                            <button
                              onClick={() => setAssetViewing(asset)}
                              className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                              title="View full prompt"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => downloadAssetImage(asset)}
                              className="text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                              title="Download this asset image"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => { setAssetEditingId(asset.id); setEditingAssetName(asset.name); }}
                              className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Rename"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      {asset.description && (
                        <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">{asset.description}</p>
                      )}
                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 4).map((tag, ti) => (
                            <span key={ti} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[8px] font-mono">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cascade Storyboard */}
          {segments && segments.length > 0 && (
            <div className="space-y-3 border border-indigo-500/20 bg-indigo-950/10 rounded-2xl p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Cascade Storyboard</span>
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {generatedSegments.length}/{segments.length} parts rendered. Generate in order — each part reuses its character asset and continuation anchors, so face, clothing, voice and flow stay consistent.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleGenerateAllSegments}
                    disabled={isGenerating || generatingSegmentIndex !== null}
                    className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    title="Generate all remaining segments in order"
                  >
                    {isGenerating || generatingSegmentIndex !== null ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ListOrdered className="w-3 h-3" />
                    )}
                    <span>Generate All Remaining</span>
                  </button>
                  <button
                    onClick={handleAddSegment}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Add a new part to the storyboard"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Part</span>
                  </button>
                  <button
                    onClick={handleClearCascade}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50"
                    title="Clear cascade segments"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[440px] overflow-y-auto scrollbar-thin pr-1">
                {segments.map((seg, i) => {
                  const isDone = generatedSegments.includes(i);
                  const isGeneratingThis = generatingSegmentIndex === i;
                  const isQueued = queuedSegments.includes(i);
                  const needsRefine = Boolean(seg.editable) && !seg.refined;
                  const segAsset = seg.assetId ? assets.find(a => a.id === seg.assetId) : null;
                  return (
                    <div key={i} className={`rounded-xl border overflow-hidden ${isDone ? 'border-emerald-500/30 bg-emerald-950/10' : isGeneratingThis ? 'border-indigo-500/50 bg-indigo-950/20' : 'border-slate-800 bg-slate-900/60'}`}>
                      <div className="flex items-center justify-between gap-2 p-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0 ${isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
                            {isDone ? <Check className="w-3.5 h-3.5" /> : seg.index}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-200 truncate">{seg.title || `Part ${seg.index}`}</p>
                            <p className="text-[9px] text-slate-500 font-mono">
                              ~{snapToValidDuration(seg.estimatedSeconds)}s{needsRefine ? ' • not refined yet' : segAsset ? ` • ${segAsset.name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isDone ? (
                            <button
                              onClick={() => handleGenerateSegment(i)}
                              disabled={isGenerating || generatingSegmentIndex !== null}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                              title="Regenerate this segment (replaces its previous render)"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Regenerate
                            </button>
                          ) : isGeneratingThis ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {refiningSegmentIndex === i ? 'Refining' : 'Rendering'}
                            </span>
                          ) : isQueued ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Queued</span>
                          ) : (
                            <button
                              onClick={() => handleGenerateSegment(i)}
                              disabled={isGenerating || generatingSegmentIndex !== null}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                              title="Generate this segment"
                            >
                              <Play className="w-3 h-3" />
                              {needsRefine ? 'Refine & Generate' : 'Generate'}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyVideoPrompt(`seg-${i}`, seg.prompt)}
                            className={`p-1 rounded-md border transition-colors ${
                              copiedPromptId === `seg-${i}`
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
                            }`}
                            title="Copy this segment's prompt"
                          >
                            {copiedPromptId === `seg-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => setExpandedSegmentId(expandedSegmentId === i ? null : i)}
                            className={`p-1 rounded-md border transition-colors ${
                              expandedSegmentId === i
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
                            }`}
                            title="Edit this part's prompt and title"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSegment(i)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                            title="Delete this part"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Character asset selector */}
                      <div className="mx-2.5 mb-2 flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 shrink-0">
                          <Users className="w-3 h-3" />
                          Character
                        </span>
                        <select
                          value={seg.assetId || ''}
                          onChange={(e) => handleAssignAssetToSegment(i, e.target.value)}
                          disabled={isGenerating || generatingSegmentIndex !== null}
                          className="flex-1 bg-slate-950/70 border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 cursor-pointer"
                          title="Which character asset to use as this part's first frame"
                        >
                          <option value="">No reference image</option>
                          {assets.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}{a.role === 'main' ? ' (main)' : ''}</option>
                          ))}
                        </select>
                      </div>

                      {expandedSegmentId === i && (
                        <div className="mx-2.5 mb-2.5 space-y-2">
                          <input
                            value={seg.title}
                            onChange={(e) => handleEditSegment(i, { title: e.target.value })}
                            placeholder="Part title"
                            className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                          <textarea
                            value={seg.prompt}
                            onChange={(e) => handleEditSegment(i, { prompt: e.target.value })}
                            placeholder={seg.editable ? "Paste the next part's content here — AI will refine it as a continuation of the story (same character & voice)." : "Edit this segment's prompt — tweak the text, then Generate. Use Refine as Continuation to re-polish it against the previous part."}
                            className="w-full h-28 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-[10px] text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none font-mono leading-relaxed"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRefineSegment(i)}
                              disabled={refiningSegmentIndex !== null || isGenerating || generatingSegmentIndex !== null}
                              className="px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                            >
                              {refiningSegmentIndex === i ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3 text-cyan-400" />
                              )}
                              <span>{refiningSegmentIndex === i ? 'Refining...' : 'Refine as Continuation'}</span>
                            </button>
                            <span className="text-[9px] text-slate-500 hidden sm:block">
                              {seg.editable ? 'Manual edits are preserved; Generate applies them as-is.' : 'Edited text is used verbatim on Generate; no extra AI rewriting.'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleAddSegment}
                className="w-full py-2.5 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-slate-400 hover:text-indigo-300 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Append a new part to continue the story"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Part to Cascade</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Character asset lightbox */}
      {assetViewing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-sm"
          onClick={() => setAssetViewing(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAssetViewing(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-slate-900/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row gap-0 md:gap-5">
              <div className="md:w-1/2 shrink-0 bg-slate-950 flex items-center justify-center">
                <img
                  src={assetViewing.image || undefined}
                  alt={assetViewing.name}
                  className="w-full h-auto md:h-full md:max-h-[70vh] object-cover"
                />
              </div>

              <div className="flex-1 p-5 md:p-6 space-y-3 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-slate-100">{assetViewing.name}</h3>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${assetViewing.role === 'main' ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40' : 'bg-slate-800 text-slate-300 border-white/15'}`}>
                    {assetViewing.role === 'main' ? 'Main' : 'Supporting'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${assetViewing.source === 'upload' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'}`}>
                    {assetViewing.source === 'upload' ? 'Uploaded' : 'AI Generated'}
                  </span>
                </div>

                {assetViewing.description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">{assetViewing.description}</p>
                )}

                {assetViewing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {assetViewing.tags.map((tag, ti) => (
                      <span key={ti} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-mono">{tag}</span>
                    ))}
                  </div>
                )}

                {assetViewing.prompt ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Image prompt</span>
                      <button
                        onClick={() => handleCopyAssetPrompt(assetViewing)}
                        className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-md border px-1.5 py-0.5 transition-colors cursor-pointer ${
                          copiedPromptId === `asset-${assetViewing.id}`
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
                        }`}
                        title="Copy full prompt"
                      >
                        {copiedPromptId === `asset-${assetViewing.id}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{copiedPromptId === `asset-${assetViewing.id}` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 leading-relaxed max-h-40 overflow-y-auto break-words scrollbar-thin">
                      {assetViewing.prompt}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">
                    {assetViewing.source === 'upload' ? 'This asset was uploaded by you, so no generation prompt exists.' : 'No prompt saved for this asset.'}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => downloadAssetImage(assetViewing)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download this asset image"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Image</span>
                  </button>
                  {assetViewing.role !== 'main' && (
                    <button
                      onClick={() => { handleSetMainAsset(assetViewing.id); setAssetViewing({ ...assetViewing, role: 'main' }); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Make this the main (default) character"
                    >
                      <Users className="w-3 h-3" />
                      <span>Set as Main</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
