/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type ImageModelId =
  | 'gemini-3.1-flash-image'
  | 'gemini-3-pro-image'
  | 'gemini-3.1-flash-lite-image'
  | 'imagen-3.0-generate-002'
  | 'gemini-2.5-flash-image'
  | (string & {});

export interface ImageModelOption {
  value: ImageModelId;
  label: string;
  sublabel: string;
  badge?: string;
  description?: string;
}

export const IMAGE_MODELS: ImageModelOption[] = [
  {
    value: 'gemini-3.1-flash-image',
    label: 'Gemini 3.1 Flash Image',
    sublabel: 'Native Multimodal (ex-Nano Banana 2)',
    badge: 'Recommended',
    description: 'Fast, high-efficiency Gemini 3.1 image model'
  },
  {
    value: 'gemini-3-pro-image',
    label: 'Gemini 3 Pro Image',
    sublabel: 'High Fidelity Studio Quality (ex-Nano Banana Pro)',
    badge: 'Pro Quality',
    description: 'Flagship Gemini 3 professional image generation engine'
  },
  {
    value: 'gemini-3.1-flash-lite-image',
    label: 'Gemini 3.1 Flash Lite Image',
    sublabel: 'Ultra-Fast Execution',
    badge: 'Ultra Fast',
    description: 'Low-latency Gemini 3.1 lite model for rapid drafts'
  },
  {
    value: 'imagen-3.0-generate-002',
    label: 'Imagen 3 High Quality',
    sublabel: 'Dedicated Image Backbone (Legacy)',
    badge: 'Imagen 3',
    description: 'Standalone Imagen 3 photorealistic generation model'
  },
  {
    value: 'gemini-2.5-flash-image',
    label: 'Gemini 2.5 Flash Image',
    sublabel: 'Legacy Flash Image Fallback',
    badge: 'Legacy',
    description: 'Gemini 2.5 flash image model fallback'
  }
];

export const DEFAULT_IMAGE_MODEL: ImageModelId = 'gemini-3.1-flash-image';

export type VideoAspectRatio = '16:9' | '9:16';

export type VideoResolution = '720p' | '1080p';

export const VIDEO_RESOLUTIONS: VideoResolution[] = ['720p', '1080p'];

export const VIDEO_DURATIONS = [4, 5, 6, 8, 10, 12, 15] as const;

export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

export interface VideoGenerationOptions {
  imageBase64?: string;
  endImageBase64?: string;
  resolution?: VideoResolution;
  durationSeconds?: number;
  negativePrompt?: string;
  generateAudio?: boolean;
  referenceImages?: string[];
}

export type VideoModelId =
  | 'veo-3.1-lite-generate-preview'
  | 'veo-3.1-fast-generate-preview'
  | 'veo-3.1-generate-preview'
  | 'gemini-omni-flash-preview';

export const VEO_LITE_MODEL = 'veo-3.1-lite-generate-preview' as const;
export const VEO_FAST_MODEL = 'veo-3.1-fast-generate-preview' as const;
export const VEO_QUALITY_MODEL = 'veo-3.1-generate-preview' as const;
export const OMNI_FLASH_MODEL = 'gemini-omni-flash-preview' as const;

export const VIDEO_MODELS: { id: VideoModelId; label: string }[] = [
  { id: VEO_LITE_MODEL, label: 'Veo 3.1 Lite (Fast)' },
  { id: VEO_FAST_MODEL, label: 'Veo 3.1 Fast' },
  { id: VEO_QUALITY_MODEL, label: 'Veo 3.1 High-Quality' },
  { id: OMNI_FLASH_MODEL, label: 'Gemini Omni Flash' }
];

export const DEFAULT_VIDEO_MODEL: VideoModelId = VEO_LITE_MODEL;

export const VIDEO_ASPECT_RATIOS: VideoAspectRatio[] = ['16:9', '9:16'];

/** Which runtime executes the model call. 'gemini' = @google/genai; 'gateway' = Vercel AI Gateway (AI SDK v6). */
export type VideoBackend = 'gemini' | 'gateway';

/** Capability tags understood by the UI and adapters: t2v/i2v/r2v/first-last-frame. */
export type VideoCapability = 't2v' | 'i2v' | 'r2v' | 'first-last-frame';

export type VideoImageInput = 'none' | 'single' | 'multiple';

/** Client-safe metadata for a video model. Source of truth lives in this shared file; the server registry adds helpers only. */
export interface VideoModelInfo {
  id: string;
  label: string;
  provider: string;
  backend: VideoBackend;
  capabilities: VideoCapability[];
  imageInput: VideoImageInput;
  /** Supports first-last-frame (an end-frame image upload). */
  endFrame: boolean;
  /** Can synthesize audio alongside the video. */
  audio: boolean;
  /** Audio is always produced and cannot be toggled (e.g. Gemini Omni Flash). */
  audioLocked?: boolean;
  resolutions: VideoResolution[];
  durations: number[];
  aspectRatios: VideoAspectRatio[];
  description: string;
  note?: string;
}

export const VIDEO_MODEL_CATALOG: VideoModelInfo[] = [
  {
    id: VEO_LITE_MODEL,
    label: 'Veo 3.1 Lite (Fast)',
    provider: 'Google Gemini',
    backend: 'gemini',
    capabilities: ['t2v', 'i2v'],
    imageInput: 'single',
    endFrame: false,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    aspectRatios: ['16:9', '9:16'],
    description: 'Fastest Veo 3.1 tier on Gemini. Great for quick motion drafts while keeping high visual quality.'
  },
  {
    id: VEO_FAST_MODEL,
    label: 'Veo 3.1 Fast',
    provider: 'Google Gemini',
    backend: 'gemini',
    capabilities: ['t2v', 'i2v'],
    imageInput: 'single',
    endFrame: false,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    aspectRatios: ['16:9', '9:16'],
    description: 'Veo 3.1 Fast tier on Gemini — short clips with crisp motion and native audio.'
  },
  {
    id: VEO_QUALITY_MODEL,
    label: 'Veo 3.1 High-Quality',
    provider: 'Google Gemini',
    backend: 'gemini',
    capabilities: ['t2v', 'i2v', 'first-last-frame'],
    imageInput: 'single',
    endFrame: true,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    aspectRatios: ['16:9', '9:16'],
    description: 'Highest-quality Veo 3.1 tier on Gemini. Supports first/last-frame control for precise scene transitions.'
  },
  {
    id: OMNI_FLASH_MODEL,
    label: 'Gemini Omni Flash',
    provider: 'Google Gemini',
    backend: 'gemini',
    capabilities: ['t2v', 'i2v'],
    imageInput: 'single',
    endFrame: false,
    audio: true,
    audioLocked: true,
    resolutions: ['720p'],
    durations: [4, 6, 8],
    aspectRatios: ['16:9', '9:16'],
    description: 'Gemini Omni Flash via the Interactions API. Always produces native audio; outputs 720p only.'
  },
  {
    id: 'google/veo-3.1-fast-generate-001',
    label: 'Veo 3.1 Fast (AI Gateway)',
    provider: 'Vercel AI Gateway → Google',
    backend: 'gateway',
    capabilities: ['t2v', 'i2v', 'first-last-frame'],
    imageInput: 'single',
    endFrame: true,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    aspectRatios: ['16:9', '9:16'],
    description: 'Fast Veo 3.1 tier routed through the Vercel AI Gateway for quicker turnaround.'
  },
  {
    id: 'google/veo-3.1-generate-001',
    label: 'Veo 3.1 (AI Gateway)',
    provider: 'Vercel AI Gateway → Google',
    backend: 'gateway',
    capabilities: ['t2v', 'i2v', 'first-last-frame'],
    imageInput: 'single',
    endFrame: true,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    aspectRatios: ['16:9', '9:16'],
    description: 'Veo 3.1 routed through the Vercel AI Gateway with unified video parameters.'
  },
  {
    id: 'klingai/kling-v2.6-t2v',
    label: 'Kling 2.6 (Text-to-Video)',
    provider: 'Vercel AI Gateway → Kling AI',
    backend: 'gateway',
    capabilities: ['t2v'],
    imageInput: 'none',
    endFrame: false,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    aspectRatios: ['16:9', '9:16'],
    description: 'Text-to-video only — builds motion from the narrative prompt without a reference frame.'
  },
  {
    id: 'alibaba/wan-v2.6-i2v',
    label: 'Wan 2.6 (Image-to-Video)',
    provider: 'Vercel AI Gateway → Alibaba',
    backend: 'gateway',
    capabilities: ['i2v'],
    imageInput: 'single',
    endFrame: false,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [5, 10, 15],
    aspectRatios: ['16:9', '9:16'],
    description: 'Image-to-video model that animates a single reference frame into motion.'
  },
  {
    id: 'bytedance/seedance-v1.5-pro',
    label: 'Seedance 1.5 Pro',
    provider: 'Vercel AI Gateway → ByteDance',
    backend: 'gateway',
    capabilities: ['t2v', 'i2v'],
    imageInput: 'single',
    endFrame: false,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [4, 8, 12],
    aspectRatios: ['16:9', '9:16'],
    description: 'ByteDance Seedance model supporting both text- and image-to-video.'
  },
  {
    id: 'klingai/kling-v2.6-r2v',
    label: 'Kling 2.6 (Reference-to-Video)',
    provider: 'Vercel AI Gateway → Kling AI',
    backend: 'gateway',
    capabilities: ['r2v'],
    imageInput: 'multiple',
    endFrame: false,
    audio: true,
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    aspectRatios: ['16:9', '9:16'],
    description: 'Reference-to-video: accepts multiple reference images for subject/style consistency across the clip.',
    note: 'Multi-image reference support is experimental.'
  }
];

/** Which runtime executes a model call. 'gemini' = @google/genai; 'gateway' = Vercel AI Gateway (AI SDK). */
export type ModelBackend = 'gemini' | 'gateway';

export type ModelModality = 'text' | 'image' | 'image-edit' | 'voice' | 'video';

/** Client-safe metadata for a non-video model (text/image/voice). Video models use the richer VideoModelInfo. */
export interface ModelEntry {
  id: string;
  label: string;
  provider: string;
  backend: ModelBackend;
  description?: string;
  /** Model accepts image inputs for analysis (multimodal vision). */
  vision?: boolean;
}

/** Curated Vercel AI Gateway text models (mirrors the @ai-sdk/gateway GatewayModelId list). */
export const GATEWAY_TEXT_MODELS: ModelEntry[] = [
  { id: 'google/gemini-3.6-flash', label: 'Gemini 3.6 Flash', provider: 'AI Gateway → Google', backend: 'gateway', description: 'Fast multimodal reasoning through the gateway.', vision: true },
  { id: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'AI Gateway → Google', backend: 'gateway', description: 'Balanced speed and quality text model.', vision: true },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'AI Gateway → Google', backend: 'gateway', description: 'High-reasoning gateway model for deep tasks.', vision: true },
  { id: 'google/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', provider: 'AI Gateway → Google', backend: 'gateway', description: 'Ultra-fast lite gateway model.', vision: true },
  { id: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'Flagship OpenAI reasoning model.', vision: true },
  { id: 'openai/gpt-5.6-sol', label: 'GPT-5.6 Sol', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'OpenAI fast-reasoning tier.', vision: true },
  { id: 'openai/gpt-5.4', label: 'GPT-5.4', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'General-purpose OpenAI chat model.', vision: true },
  { id: 'openai/gpt-5.4-mini', label: 'GPT-5.4 Mini', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'Compact, low-latency OpenAI model.', vision: true },
  { id: 'anthropic/claude-opus-5', label: 'Claude Opus 5', provider: 'AI Gateway → Anthropic', backend: 'gateway', description: 'Anthropic flagship writing/reasoning model.', vision: true },
  { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5', provider: 'AI Gateway → Anthropic', backend: 'gateway', description: 'Balanced Anthropic model for long-form content.', vision: true },
  { id: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5', provider: 'AI Gateway → Anthropic', backend: 'gateway', description: 'Fast Anthropic model for quick drafts.', vision: true },
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'AI Gateway → DeepSeek', backend: 'gateway', description: 'High-performance open-weights reasoning model.' },
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'AI Gateway → DeepSeek', backend: 'gateway', description: 'Fast DeepSeek tier for everyday generation.' },
  { id: 'xai/grok-4.5', label: 'Grok 4.5', provider: 'AI Gateway → xAI', backend: 'gateway', description: 'xAI general-purpose conversational model.', vision: true },
  { id: 'meta/llama-4-maverick', label: 'Llama 4 Maverick', provider: 'AI Gateway → Meta', backend: 'gateway', description: 'Open-weight Meta multimodal model.', vision: true },
  { id: 'mistral/mistral-large-3', label: 'Mistral Large 3', provider: 'AI Gateway → Mistral', backend: 'gateway', description: 'European frontier model for structured output.' },
  { id: 'minimax/minimax-m3', label: 'MiniMax M3', provider: 'AI Gateway → MiniMax', backend: 'gateway', description: 'Cost-efficient general text model.' },
  { id: 'alibaba/qwen3.7-max', label: 'Qwen3.7 Max', provider: 'AI Gateway → Alibaba', backend: 'gateway', description: 'Alibaba flagship large model.' },
  { id: 'zai/glm-5', label: 'GLM-5', provider: 'AI Gateway → Zhipu AI', backend: 'gateway', description: 'Zhipu general-purpose reasoning model.' }
];

/** Curated Vercel AI Gateway image models (mirrors the @ai-sdk/gateway GatewayImageModelId list). */
export const GATEWAY_IMAGE_MODELS: ModelEntry[] = [
  { id: 'openai/gpt-image-2', label: 'GPT Image 2', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'Latest OpenAI image generation model.' },
  { id: 'openai/gpt-image-1.5', label: 'GPT Image 1.5', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'High-quality OpenAI image model.' },
  { id: 'openai/gpt-image-1', label: 'GPT Image 1', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'Original OpenAI gpt-image tier.' },
  { id: 'google/imagen-4.0-ultra-generate-001', label: 'Imagen 4.0 Ultra', provider: 'AI Gateway → Google', backend: 'gateway', description: 'Photorealistic Imagen flagship.' },
  { id: 'google/imagen-4.0-generate-001', label: 'Imagen 4.0', provider: 'AI Gateway → Google', backend: 'gateway', description: 'Balanced Imagen generation tier.' },
  { id: 'google/imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast', provider: 'AI Gateway → Google', backend: 'gateway', description: 'Low-latency Imagen tier.' },
  { id: 'bfl/flux-2-pro', label: 'FLUX 2 Pro', provider: 'AI Gateway → BFL', backend: 'gateway', description: 'Black Forest Labs professional tier.' },
  { id: 'bfl/flux-2-flex', label: 'FLUX 2 Flex', provider: 'AI Gateway → BFL', backend: 'gateway', description: 'Flexible fast FLUX tier.' },
  { id: 'bfl/flux-2-max', label: 'FLUX 2 Max', provider: 'AI Gateway → BFL', backend: 'gateway', description: 'Maximum quality FLUX generation.' },
  { id: 'recraft/recraft-v4.1-pro', label: 'Recraft V4.1 Pro', provider: 'AI Gateway → Recraft', backend: 'gateway', description: 'Brand/vector-friendly generation model.' },
  { id: 'recraft/recraft-v4', label: 'Recraft V4', provider: 'AI Gateway → Recraft', backend: 'gateway', description: 'Recraft standard image tier.' },
  { id: 'bytedance/seedream-4.5', label: 'Seedream 4.5', provider: 'AI Gateway → ByteDance', backend: 'gateway', description: 'ByteDance high-fidelity image model.' },
  { id: 'bytedance/seedream-5.0-pro', label: 'Seedream 5.0 Pro', provider: 'AI Gateway → ByteDance', backend: 'gateway', description: 'ByteDance flagship image tier.' },
  { id: 'xai/grok-imagine-image', label: 'Grok Imagine', provider: 'AI Gateway → xAI', backend: 'gateway', description: 'xAI image generation model.' },
  { id: 'prodia/flux-fast-schnell', label: 'FLUX Schnell (Prodia)', provider: 'AI Gateway → Prodia', backend: 'gateway', description: 'Very fast open FLUX tier.' }
];

/** Curated Vercel AI Gateway speech models (mirrors the @ai-sdk/gateway GatewaySpeechModelId list). */
export const GATEWAY_VOICE_MODELS: ModelEntry[] = [
  { id: 'openai/tts-1-hd', label: 'OpenAI TTS HD', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'High-fidelity OpenAI neural voice.' },
  { id: 'openai/tts-1', label: 'OpenAI TTS', provider: 'AI Gateway → OpenAI', backend: 'gateway', description: 'Standard OpenAI neural voice tier.' },
  { id: 'xai/grok-tts', label: 'Grok TTS', provider: 'AI Gateway → xAI', backend: 'gateway', description: 'xAI text-to-speech model.' }
];

export const GATEWAY_TEXT_DEFAULT = 'google/gemini-3.6-flash';
export const GATEWAY_IMAGE_DEFAULT = 'openai/gpt-image-1.5';
export const GATEWAY_VOICE_DEFAULT = 'openai/tts-1-hd';

/** Resolve the runtime backend for a model id from the shared catalogs. Falls back to 'gemini' for unknown/custom ids. */
export const gatewayBackendForId = (modality: ModelModality, id?: string): ModelBackend => {
  if (!id) return 'gemini';
  if (modality === 'video') {
    return VIDEO_MODEL_CATALOG.find(v => v.id === id)?.backend || 'gemini';
  }
  const list =
    modality === 'image' || modality === 'image-edit'
      ? GATEWAY_IMAGE_MODELS
      : modality === 'voice'
        ? GATEWAY_VOICE_MODELS
        : GATEWAY_TEXT_MODELS;
  return list.some(m => m.id === id) ? 'gateway' : 'gemini';
};

/**
 * Client-safe: does the given text/research model accept image input?
 * Gemini-native text ids always support vision; gateway entries declare it via
 * the `vision` flag on GATEWAY_TEXT_MODELS.
 */
export const textModelSupportsVision = (id?: string): boolean => {
  if (!id) return false;
  if (gatewayBackendForId('text', id) === 'gemini') return true;
  return Boolean(GATEWAY_TEXT_MODELS.find(m => m.id === id)?.vision);
};

export interface ModelCatalogDefaults {
  text: string;
  image: string;
  imageEdit: string;
  voice: string;
  video: string;
}

export interface ModelCatalogResponse {
  gatewayConfigured: boolean;
  gatewayBaseURL?: string;
  defaults: ModelCatalogDefaults;
  text: ModelEntry[];
  image: ModelEntry[];
  imageEdit: ModelEntry[];
  voice: ModelEntry[];
  video: ModelEntry[];
}

export type ComplexityLevel = 'Default' | 'Elementary' | 'High School' | 'College' | 'Expert';

export type VisualStyle = 'Default' | 'Minimalist' | 'Realistic' | 'Cartoon' | 'Vintage' | 'Futuristic' | '3D Render' | 'Sketch' | 'Carousel';

export type Language = 'Default' | 'English' | 'Spanish' | 'French' | 'German' | 'Mandarin' | 'Japanese' | 'Hindi' | 'Arabic' | 'Portuguese' | 'Russian';

export interface Annotation {
  id: string;
  type: 'text' | 'arrow' | 'rect' | 'circle' | 'pen';
  x: number; // relative coordinate 0-1 (percentage of width)
  y: number; // relative coordinate 0-1 (percentage of height)
  width?: number; // relative 0-1
  height?: number; // relative 0-1
  text?: string;
  color: string;
  size?: number; // Brush thickness or font size
  points?: { x: number; y: number }[]; // For pen strokes, relative coordinates 0-1
}

export interface GeneratedImage {
  id: string;
  data: string; // Base64 data URL
  prompt: string; // The original user topic/query
  imagePrompt: string; // The generated professional-grade descriptive visual prompt
  timestamp: number;
  level: ComplexityLevel;
  style: VisualStyle;
  language: Language;
  resolution: AspectRatio;
  subOptions?: Record<string, string>;
  facts?: string[];
  searchResults?: SearchResultItem[];
  annotations?: Annotation[];
}

export interface SearchResultItem {
  title: string;
  url: string;
}

export interface ResearchResult {
  imagePrompt: string;
  facts: string[];
  searchResults: SearchResultItem[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface SubtitleSegment {
  id: number;
  startMs: number;
  endMs: number;
  startTime: string; // SRT timestamp e.g. "00:00:01,250"
  endTime: string;   // SRT timestamp e.g. "00:00:04,100"
  text: string;
}

export interface CarouselSlide {
  slideNumber: number;
  title: string;
  visualPrompt: string;
  contentText?: string;
  imageUrl?: string;
  generated?: boolean;
  voiceOver?: string;
  videoPrompt?: string;
  videoId?: string;
  videoUrl?: string;
  videoGenerating?: boolean;
  videoGenerated?: boolean;
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
  ttsModel?: string;
  accent?: string;
  personaStyle?: string;
  deliveryTone?: string;
  speechSpeed?: string;
  animationStyle?: string;
  audioUrl?: string;
  subtitles?: SubtitleSegment[];
  srtText?: string;
  suggestedVoiceCharacter?: string;
}

export interface SocialPostCampaignItem {
  day: string;
  topic: string;
  visualPrompt: string;
  caption: string;
  hashtags: string[];
  suggestedStyle: VisualStyle;
  aspectRatio: AspectRatio;
  imageUrl?: string;
  generated?: boolean;
  isCarousel?: boolean;
  slides?: CarouselSlide[];
  voiceOver?: string;
  videoPrompt?: string;
  videoId?: string;
  videoUrl?: string;
  videoGenerating?: boolean;
  videoGenerated?: boolean;
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
  ttsModel?: string;
  accent?: string;
  personaStyle?: string;
  deliveryTone?: string;
  speechSpeed?: string;
  animationStyle?: string;
  audioUrl?: string;
  subtitles?: SubtitleSegment[];
  srtText?: string;
  suggestedVoiceCharacter?: string;
}

export interface SavedCampaign {
  id: string;
  projectId?: string;
  name: string;
  websiteUrl: string;
  mainTopic: string;
  platform: string;
  postCount: number;
  /** Number of carousel slides per carousel deck post (user-selected at creation) */
  slidesPerPost?: number;
  customRequirements?: string;
  aiModel?: string;
  /** User-selected aspect ratio at campaign creation — preserved across re-generations */
  preferredAspect?: AspectRatio;
  /** User-selected visual style at campaign creation — preserved across re-generations */
  preferredStyle?: string;
  posts: SocialPostCampaignItem[];
  createdAt: number;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  searchResults?: SearchResultItem[];
  groundingSources?: { title?: string; uri: string }[];
  suggestedCampaignTopic?: string;
  suggestedPrompt?: string;
  suggestedVideoPrompt?: string;
  suggestedVideoScript?: string;
  isDeepResearch?: boolean;
  /** Data-URL images attached to a user message for vision-capable models. */
  imageUrls?: string[];
}

export interface ResearchSession {
  id: string;
  title: string;
  companyContext?: string;
  competitorWebsite?: string;
  mode?: 'grounded' | 'deep';
  model?: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageItem[];
}

export interface SlideAnimation {
  intro: 'fade' | 'slide_left' | 'slide_up' | 'zoom' | 'blur' | 'flip';
  floating: 'none' | 'pulse' | 'drift' | 'tilt' | 'ken_burns';
  overlayAnimation: 'none' | 'pop' | 'ripple' | 'slide_corner' | 'spin';
  duration: number; // in seconds
}

export interface SlideAudioTrack {
  id: string;
  name: string;
  url: string;
  startTime: number; // start offset in seconds
  endTime: number; // end trim point in seconds
  duration: number; // total track duration
  voiceName?: string;
}

export interface PresenterSlide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  bodyText?: string;
  imageUrl?: string;
  overlayImageUrl?: string;
  layout: 'split' | 'hero' | 'quote' | 'features' | 'stats';
  animation: SlideAnimation;
  audioTrack?: SlideAudioTrack;
  speakerNotes?: string;
  slideDuration?: number; // in seconds
}

export type ViewType = 'dashboard' | 'canvas' | 'drafts' | 'gallery' | 'research' | 'presenter-studio' | 'voiceover-studio' | 'video-studio' | 'sound-studio' | 'models' | 'blog';

export interface DraftPrompt {
  id: string;
  topic: string;
  complexityLevel: ComplexityLevel;
  visualStyle: VisualStyle;
  language: Language;
  resolution: AspectRatio;
  imageModel?: ImageModelId;
  subOptions: Record<string, string>;
  createdAt: number;
  sourceType?: 'manual' | 'visual-canvas' | 'campaign';
  sourceCampaignName?: string;
  sourceCampaignId?: string;
  slideNumber?: number;
  slideTitle?: string;
  visualPrompt?: string;
}

export interface PublishEndpointConfig {
  id: string;
  name: string;
  endpointUrl: string;
  secretKey: string;
  headerName: string;
  enabled: boolean;
  isDefault?: boolean;
  /** Public base URL where published posts are reachable (e.g. https://growency.ai/blog). Used to build backlink URLs. */
  blogBaseUrl?: string;
  /** HTTP method used to update an already-published post by slug (defaults to PUT). */
  updateMethod?: 'PUT' | 'PATCH';
}

/** A related, previously published post the AI links back to (SEO interlinking). */
export interface BlogRelatedPost {
  title: string;
  slug: string;
  url: string;
  reason?: string;
}

export interface SectionImagePromptItem {
  id: string;
  prompt: string;
  tag: string;
  /** Hosted URL (Cloudinary) once the generated preview has been uploaded and embedded in the post. */
  generatedUrl?: string;
  /** Raw generated preview (base64 data URL) — shown in the UI only, never embedded in post markdown. */
  previewDataUrl?: string;
  aspectRatio?: string;
}

export interface SavedBlogDraft {
  id: string;
  sessionId?: string;
  campaignId?: string;
  campaignTitle?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  metaDescription?: string;
  keywords?: string[];
  markdownContent: string;
  characterCount: number;
  readingTimeMinutes: number;
  embeddedImagesCount: number;
  sectionImagePrompts?: SectionImagePromptItem[];
  relatedPosts?: BlogRelatedPost[];
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
  publishedAt?: string;
  publishedEndpointId?: string;
  /** Snapshot of the markdown body that was last successfully published (for dirty-state comparison). */
  publishedMarkdown?: string;
  /** Snapshot of the title that was last successfully published (for dirty-state comparison). */
  publishedTitle?: string;
  createdAt: number | string;
  updatedAt: number | string;
}

export interface SectionImagePrompt {
  id: string;
  prompt: string;
  tag: string;
  /** Hosted URL (Cloudinary) once the generated preview has been uploaded and embedded in the post. */
  generatedUrl?: string;
  /** Raw generated preview (base64 data URL) — shown in the UI only, never embedded in post markdown. */
  previewDataUrl?: string;
  aspectRatio?: string;
}

export interface BlogPostResult {
  title: string;
  slug?: string;
  excerpt?: string;
  metaDescription?: string;
  keywords?: string[];
  markdownContent: string;
  characterCount: number;
  readingTimeMinutes: number;
  embeddedImagesCount: number;
  sectionImagePrompts: SectionImagePrompt[];
  relatedPosts?: BlogRelatedPost[];
}

export interface CronScheduleItem {
  id: string;
  campaignId?: string;
  campaignTitle?: string;
  draftId?: string;
  postTitle: string;
  cronExpression: string; // e.g. "0 9 * * 1"
  cronHumanReadable?: string;
  scheduledDateTime?: string; // ISO datetime
  endpointId: string;
  endpointName?: string;
  status: 'active' | 'paused' | 'completed';
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VideoGenerationResult {
  operationName?: string;
  videoUrl?: string;
  isSimulated?: boolean;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}