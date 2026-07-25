import { getAi, TEXT_MODEL, getMimeTypeAndData } from "./config";

export interface VideoGenerationResult {
  operationName?: string;
  videoUrl?: string;
  isSimulated?: boolean;
}

export const generateVeoVideo = async (
  prompt: string,
  imageBase64?: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<VideoGenerationResult> => {
  // If we have an image base64, clean it up
  let imagePayload: any = undefined;
  if (imageBase64) {
    try {
      const { mimeType, data } = getMimeTypeAndData(imageBase64);
      imagePayload = {
        imageBytes: data,
        mimeType: mimeType
      };
    } catch (e) {
      console.error("Error formatting reference image for VEO", e);
    }
  }

  try {
    // VEO requires a paid API key or specific project settings
    // Call the direct generateVideos model
    const op = await getAi().models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      image: imagePayload,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio === '1:1' ? '9:16' : aspectRatio // VEO supports 16:9 and 9:16
      }
    });

    return {
      operationName: op.name,
      isSimulated: false
    };
  } catch (err: any) {
    console.warn("VEO API failed or model require paid key, falling back to simulated high-fidelity cinematic render", err);
    
    // We return a simulated flag so the frontend can play a spectacular Ken Burns cinematic video preview
    // synced with beautiful subtitles and voiceover playback!
    return {
      isSimulated: true,
      videoUrl: imageBase64 || "" // Use the slide image to trigger our high-fidelity client-side animator
    };
  }
};

export const generateVoiceOverAndVideoPrompt = async (
  topic: string,
  content: string,
  visualPrompt: string,
  aspectRatio: string = '16:9'
): Promise<{ voiceOver: string; videoPrompt: string }> => {
  const systemPrompt = `
    You are an elite cinematic director and commercial video scriptwriter.
    We are creating an engaging social media video for: "${topic}".
    The visual context is described as: "${visualPrompt}".
    The main slide/post content or caption is: "${content}".

    Create a compelling 10-15 second voiceover script AND a cinematic video description/prompt that we can pass to an AI video generator like VEO.
    The aspect ratio is ${aspectRatio}.

    Return your output ONLY as a valid JSON object following this format:
    {
      "voiceOver": "The spoken word-for-word voiceover script. Keep it punchy, rhythmic, and perfect for reading aloud.",
      "videoPrompt": "A highly cinematic, dynamic scene direction prompt for VEO. Describe camera movement (e.g. slow pan, dolly in, camera drift), lighting effects, motion dynamics, and high-fidelity textures."
    }
  `;

  try {
    const response = await getAi().models.generateContent({
      model: TEXT_MODEL,
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as { voiceOver: string; videoPrompt: string };
  } catch (err) {
    console.error("Failed to generate voiceover/video script", err);
    return {
      voiceOver: `Discover how we can transform ${topic} today. Clean, professional results tailored just for you.`,
      videoPrompt: `Cinematic camera pans across a modern sleek studio, high-key warm ambient lighting, highly detailed textures, smooth 4k render.`
    };
  }
};
