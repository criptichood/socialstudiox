import { createGateway, experimental_generateVideo } from "ai";
import { VideoGenerationOptions, VideoAspectRatio } from "@/types";
import { getGatewayConfig, getGlobalMap } from "@/services/server/config";

/**
 * Vercel AI Gateway video adapter (AI SDK v6).
 *
 * The gateway `/video-model` endpoint is synchronous (a single SSE request that
 * blocks until the clip is rendered), so we run each call as a fire-and-forget
 * background job inside the Node process and let the client poll a job id —
 * mirroring the async Veo operation pattern. Jobs are stored in-memory and are
 * lost if the server restarts (same caveat as Veo operations).
 */

interface GatewayVideoJob {
  status: "running" | "done" | "error";
  videoBase64?: string;
  mediaType?: string;
  error?: string;
}

const gatewayVideoJobs = getGlobalMap<GatewayVideoJob>("gatewayVideoJobs");

// Gateway calls routinely exceed undici's default 5-minute body timeout.
const GATEWAY_FETCH_TIMEOUT_MS = 15 * 60 * 1000;

const resolutionToPixels = (resolution?: string): `${number}x${number}` | undefined => {
  if (resolution === "1080p") return "1920x1080";
  if (resolution === "720p") return "1280x720";
  return undefined;
};

export const startGatewayVideoGeneration = (
  modelId: string,
  prompt: string,
  aspectRatio: VideoAspectRatio = '16:9',
  options: VideoGenerationOptions = {}
): { operationName: string } => {
  const jobId = `gw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  gatewayVideoJobs.set(jobId, { status: "running" });

  runGatewayVideoJob(jobId, modelId, prompt, aspectRatio, options).catch((err: any) => {
    console.error("AI Gateway video generation failed:", err);
    gatewayVideoJobs.set(jobId, {
      status: "error",
      error: err?.message || String(err)
    });
  });

  return { operationName: jobId };
};

export const pollGatewayVideoGeneration = async (
  operationName: string
): Promise<{ done: boolean; videoUrl?: string; error?: string }> => {
  const job = gatewayVideoJobs.get(operationName);
  if (!job) {
    throw new Error("Video job not found. The server may have restarted — please try generating again.");
  }

  if (job.status === "running") {
    return { done: false };
  }

  if (job.status === "error") {
    return { done: true, error: job.error || "Video generation failed." };
  }

  return {
    done: true,
    videoUrl: `data:${job.mediaType || "video/mp4"};base64,${job.videoBase64}`
  };
};

async function runGatewayVideoJob(
  jobId: string,
  modelId: string,
  prompt: string,
  aspectRatio: VideoAspectRatio,
  options: VideoGenerationOptions
): Promise<void> {
  const { apiKey, baseURL } = getGatewayConfig();
  if (!apiKey) {
    throw new Error("AI Gateway is not configured. Add AI_GATEWAY_API_KEY to .env.local to enable gateway models.");
  }

  const gateway = createGateway({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    fetch: async (url, init) => {
      return fetch(url, {
        ...init,
        ...(init?.signal
          ? { signal: init.signal }
          : { signal: AbortSignal.timeout(GATEWAY_FETCH_TIMEOUT_MS) })
      });
    }
  });

  const referenceImages = options.referenceImages?.length
    ? options.referenceImages
    : [];

  // first/last-frame pairs are expressed as role-tagged frameImages; single
  // references ride on prompt.image; multiple references use inputReferences.
  const frameImages: Array<{ image: string; frameType: "first_frame" | "last_frame" }> = [];
  if (referenceImages.length > 0 && options.endImageBase64) {
    frameImages.push({ image: referenceImages[0], frameType: "first_frame" });
    frameImages.push({ image: options.endImageBase64, frameType: "last_frame" });
  }

  let promptInput: string | { image: string; text: string } = prompt;
  if (referenceImages.length === 1 && frameImages.length === 0) {
    promptInput = { image: referenceImages[0], text: prompt };
  }

  const result = await experimental_generateVideo({
    model: gateway.video(modelId),
    prompt: promptInput,
    duration: options.durationSeconds,
    aspectRatio,
    resolution: resolutionToPixels(options.resolution),
    generateAudio: options.generateAudio,
    ...(frameImages.length > 0 ? { frameImages } : {}),
    ...(referenceImages.length > 1 ? { inputReferences: referenceImages } : {}),
    maxRetries: 0
  });

  const video = result.videos?.[0];
  if (!video) {
    throw new Error("AI Gateway returned no video output.");
  }

  gatewayVideoJobs.set(jobId, {
    status: "done",
    videoBase64: video.base64,
    mediaType: video.mediaType || "video/mp4"
  });
}
