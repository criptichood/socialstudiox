/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type AspectRatio = '16:9' | '9:16' | '1:1';

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
}

export interface SavedCampaign {
  id: string;
  projectId?: string;
  name: string;
  websiteUrl: string;
  mainTopic: string;
  platform: string;
  postCount: number;
  customRequirements?: string;
  aiModel?: string;
  posts: SocialPostCampaignItem[];
  createdAt: number;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  searchResults?: SearchResultItem[];
  suggestedCampaignTopic?: string;
  suggestedPrompt?: string;
  suggestedVideoPrompt?: string;
  suggestedVideoScript?: string;
  isDeepResearch?: boolean;
}

export interface ResearchSession {
  id: string;
  title: string;
  companyContext?: string;
  competitorWebsite?: string;
  mode?: 'grounded' | 'deep';
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

export type ViewType = 'dashboard' | 'canvas' | 'drafts' | 'gallery' | 'research' | 'presenter-studio' | 'voiceover-studio' | 'video-studio' | 'sound-studio';

export interface DraftPrompt {
  id: string;
  topic: string;
  complexityLevel: ComplexityLevel;
  visualStyle: VisualStyle;
  language: Language;
  resolution: AspectRatio;
  subOptions: Record<string, string>;
  createdAt: number;
  sourceType?: 'manual' | 'visual-canvas' | 'campaign';
  sourceCampaignName?: string;
  sourceCampaignId?: string;
  slideNumber?: number;
  slideTitle?: string;
  visualPrompt?: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}