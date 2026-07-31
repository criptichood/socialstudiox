import { VideoGenerationResult } from "@/types";

export const generateVeoVideo = async (
  prompt: string,
  imageBase64?: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  model: string = 'veo-3.1-lite-generate-preview',
  endImageBase64?: string
): Promise<any> => {
  const response = await fetch("/api/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      imageBase64,
      aspectRatio,
      model,
      endImageBase64
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate video");
  }

  return await response.json();
};

export const pollVideoOperation = async (operation: any): Promise<any> => {
  // Since operation polling is now handled server-side within the route handler, 
  // this is kept for signature compatibility but can return the operation status.
  return { done: true, response: operation };
};

export const generateVoiceOverAndVideoPrompt = async (
  topic: string,
  content: string,
  visualPrompt: string,
  aspectRatio: string = '16:9'
): Promise<{ voiceOver: string; videoPrompt: string }> => {
  const response = await fetch("/api/video/voice-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      content,
      visualPrompt,
      aspectRatio
    })
  });

  if (!response.ok) {
    return {
      voiceOver: `Discover how we can transform ${topic} today. Clean, professional results tailored just for you.`,
      videoPrompt: `Cinematic camera pans across a modern sleek studio, high-key warm ambient lighting, highly detailed textures, smooth 4k render.`
    };
  }

  return await response.json();
};
