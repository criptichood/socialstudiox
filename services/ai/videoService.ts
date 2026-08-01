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
  aspectRatio: string = '16:9',
  campaignContext?: string
): Promise<{
  voiceOver: string;
  videoPrompt: string;
  suggestedVoiceCharacter: string;
  suggestedDeliveryTone: string;
  suggestedSpeechSpeed: string;
}> => {
  const response = await fetch("/api/video/voice-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      content,
      visualPrompt,
      aspectRatio,
      campaignContext
    })
  });

  if (!response.ok) {
    return {
      voiceOver: `[Warm, confident open] ${topic} changes the way you see things. [playful pause] Here's why it matters today. [sincere close]`,
      videoPrompt: `Cinematic camera pans across a modern sleek studio, high-key warm ambient lighting, highly detailed textures, smooth 4k render.`,
      suggestedVoiceCharacter: '',
      suggestedDeliveryTone: 'natural',
      suggestedSpeechSpeed: '1.0'
    };
  }

  return await response.json();
};

export const enhanceVoiceOverWithGuidelines = async (
  topic: string,
  existingScript: string,
  campaignContext?: string
): Promise<{
  voiceOver: string;
  suggestedVoiceCharacter: string;
  suggestedDeliveryTone: string;
  suggestedSpeechSpeed: string;
}> => {
  const response = await fetch("/api/video/voice-enhance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      existingScript,
      campaignContext
    })
  });

  if (!response.ok) {
    return {
      voiceOver: existingScript,
      suggestedVoiceCharacter: '',
      suggestedDeliveryTone: '',
      suggestedSpeechSpeed: ''
    };
  }

  return await response.json();
};
