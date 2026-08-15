/**
 * Global, module-scoped video generation manager.
 *
 * Generation lives outside any React component so it survives navigation:
 * starting a job here keeps running (and keeps polling the server) even when
 * the Video Studio unmounts. Components subscribe for state updates and the
 * App shell shows a persistent banner / failure toast for the running job.
 */
import { startVideoGeneration, pollVideoGeneration } from '@/services/geminiService';
import { DBService } from '@/services/dbService';
import { VideoAspectRatio, VideoResolution, VideoDuration } from '@/types';

export interface GeneratedVideo {
  id: string;
  projectId: string;
  videoUrl: string;
  prompt: string;
  enhancedPrompt?: string;
  model: string;
  aspectRatio: VideoAspectRatio;
  resolution?: VideoResolution;
  durationSeconds?: number;
  timestamp: number;
  referenceImageUrl?: string | null;
  isSimulated?: boolean;
  cascadeId?: string;
  segmentIndex?: number;
  assetId?: string;
}

export interface VideoGenerationParams {
  prompt: string;
  refImageBase64?: string;
  aspectRatio: VideoAspectRatio;
  model: string;
  resolution: VideoResolution;
  durationSeconds: VideoDuration;
  endImageBase64?: string;
  negativePrompt?: string;
  generateAudio?: boolean;
  referenceImages?: string[];
  projectId: string;
  cascadeId?: string;
  segmentIndex?: number;
  assetId?: string;
}

export type VideoGenerationStatus = 'idle' | 'running' | 'success' | 'error';

export interface VideoGenerationState {
  status: VideoGenerationStatus;
  step: string;
  progress: number;
  error: string | null;
  prompt: string;
  model: string;
  startedAt: number | null;
}

export const GENERATED_VIDEOS_STORAGE_KEY = 'social_studio_x_generated_videos_v1';

let state: VideoGenerationState = {
  status: 'idle',
  step: '',
  progress: 0,
  error: null,
  prompt: '',
  model: '',
  startedAt: null
};

const listeners = new Set<(s: VideoGenerationState) => void>();

export const getVideoGenerationState = (): VideoGenerationState => ({ ...state });

export const isVideoGenerationRunning = (): boolean => state.status === 'running';

export const subscribeVideoGeneration = (fn: (s: VideoGenerationState) => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const notify = () => {
  const snapshot = { ...state };
  listeners.forEach(fn => fn(snapshot));
};

const updateState = (patch: Partial<VideoGenerationState>) => {
  state = { ...state, ...patch };
  notify();
};

let runningToken: number | null = null;

export const loadGeneratedVideos = async (): Promise<GeneratedVideo[]> => {
  try {
    return await DBService.getItem<GeneratedVideo[]>(GENERATED_VIDEOS_STORAGE_KEY, []);
  } catch (e) {
    console.error('Failed to load videos from storage:', e);
    return [];
  }
};

export async function startVideoGenerationJob(params: VideoGenerationParams): Promise<GeneratedVideo> {
  if (state.status === 'running') {
    throw new Error('A video is already generating. Please wait for it to finish.');
  }

  const token = Date.now();
  runningToken = token;

  state = {
    status: 'running',
    step: 'Initializing video model pipeline...',
    progress: 5,
    error: null,
    prompt: params.prompt,
    model: params.model,
    startedAt: Date.now()
  };
  notify();

  try {
    const result = await startVideoGeneration(params.prompt, params.refImageBase64, params.aspectRatio, params.model, {
      endImageBase64: params.endImageBase64 || undefined,
      resolution: params.resolution,
      durationSeconds: params.durationSeconds,
      negativePrompt: params.negativePrompt || undefined,
      generateAudio: params.generateAudio,
      referenceImages: params.referenceImages
    });

    if (token !== runningToken) throw new Error('Generation superseded by a newer request.');

    let finalVideoUrl = result.videoUrl;

    if (!finalVideoUrl && result.operationName) {
      const startedAt = Date.now();
      let attempts = 0;
      while (!finalVideoUrl) {
        attempts++;
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        updateState({
          step: `Rendering cinematic frames... (${elapsed}s elapsed)`,
          progress: Math.min(90, 10 + attempts * 5)
        });

        await new Promise(resolve => setTimeout(resolve, 4000));

        if (token !== runningToken) throw new Error('Generation superseded by a newer request.');

        const poll = await pollVideoGeneration(result.operationName, result.provider);
        if (poll.error) throw new Error(poll.error);
        if (poll.videoUrl) {
          finalVideoUrl = poll.videoUrl;
          break;
        }
        if (attempts >= 60) {
          throw new Error('Video generation timed out after ~4 minutes. Please try again.');
        }
      }
    }

    if (!finalVideoUrl) throw new Error('Video generation returned no output.');

    const video: GeneratedVideo = {
      id: `vid-${Date.now()}`,
      projectId: params.projectId || 'global',
      videoUrl: finalVideoUrl,
      prompt: params.prompt,
      model: params.model,
      aspectRatio: params.aspectRatio,
      resolution: params.resolution,
      durationSeconds: params.durationSeconds,
      timestamp: Date.now(),
      referenceImageUrl: params.refImageBase64 || null,
      isSimulated: false,
      cascadeId: params.cascadeId,
      segmentIndex: params.segmentIndex,
      assetId: params.assetId
    };

    try {
      const stored = await DBService.getItem<GeneratedVideo[]>(GENERATED_VIDEOS_STORAGE_KEY, []);
      await DBService.setItem(GENERATED_VIDEOS_STORAGE_KEY, [video, ...(stored || [])]);
    } catch (e) {
      console.error('Failed to persist generated video:', e);
    }

    if (token !== runningToken) throw new Error('Generation superseded by a newer request.');

    updateState({ status: 'success', step: 'Video rendering completed!', progress: 100, error: null });
    return video;
  } catch (err: any) {
    if (token !== runningToken) throw err;
    const errMsg = err?.message || String(err);
    updateState({ status: 'error', step: '', progress: 0, error: errMsg });
    throw err;
  } finally {
    if (token === runningToken) runningToken = null;
  }
}

export function resetVideoGenerationState() {
  state = {
    status: 'idle',
    step: '',
    progress: 0,
    error: null,
    prompt: state.prompt,
    model: state.model,
    startedAt: null
  };
  notify();
}
