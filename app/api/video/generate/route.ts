import { NextResponse } from "next/server";
import { startVeoVideoGeneration, generateOmniFlashVideo } from "@/services/server/videoService";
import { startGatewayVideoGeneration } from "@/services/server/gatewayVideo";
import { getVideoModelSpec } from "@/services/server/modelRegistry";
import { DEFAULT_VIDEO_MODEL, OMNI_FLASH_MODEL, VideoAspectRatio } from "@/types";

export async function POST(request: Request) {
  try {
    const {
      prompt,
      imageBase64,
      referenceImages,
      aspectRatio,
      model,
      resolution,
      durationSeconds,
      negativePrompt,
      generateAudio,
      endImageBase64
    } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Missing required prompt parameter" }, { status: 400 });
    }

    const normalizedAspectRatio: VideoAspectRatio =
      aspectRatio === '9:16' ? '9:16' : '16:9';

    const spec = getVideoModelSpec(model);
    const resolvedModel = spec ? model : DEFAULT_VIDEO_MODEL;

    // Gateway-backed models run through the Vercel AI Gateway (AI SDK v6).
    if (spec?.backend === 'gateway') {
      const { operationName } = startGatewayVideoGeneration(
        resolvedModel,
        prompt,
        normalizedAspectRatio,
        { imageBase64, referenceImages, endImageBase64, resolution, durationSeconds, generateAudio }
      );
      return NextResponse.json({ success: true, provider: 'gateway', operationName });
    }

    // Gemini Omni Flash uses the synchronous Interactions API and returns the video directly.
    if (resolvedModel === OMNI_FLASH_MODEL) {
      const result = await generateOmniFlashVideo(prompt, imageBase64, aspectRatio, customApiKey, durationSeconds);
      return NextResponse.json({ success: true, provider: 'gemini', ...result });
    }

    // Veo returns a long-running operation; respond immediately and let the client poll.
    const { operationName } = await startVeoVideoGeneration(
      prompt,
      imageBase64,
      aspectRatio,
      resolvedModel,
      customApiKey,
      { resolution, durationSeconds, negativePrompt, generateAudio, endImageBase64 }
    );

    return NextResponse.json({ success: true, provider: 'gemini', operationName });
  } catch (error: any) {
    console.error("API Error: Video generation failed:", error);
    return NextResponse.json({ error: error?.message || "Video generation failed" }, { status: 500 });
  }
}
