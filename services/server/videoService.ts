import { getAi, TEXT_MODEL, getMimeTypeAndData } from "@/services/server/config";

export interface VideoGenerationResult {
  operationName?: string;
  videoUrl?: string;
  isSimulated?: boolean;
}

export const generateVeoVideo = async (
  prompt: string,
  imageBase64?: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  model: string = 'veo-3.1-lite-generate-preview',
  endImageBase64?: string,
  customApiKey?: string
): Promise<any> => {
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

  let lastFramePayload: any = undefined;
  if (endImageBase64) {
    try {
      const { mimeType, data } = getMimeTypeAndData(endImageBase64);
      lastFramePayload = {
        imageBytes: data,
        mimeType: mimeType
      };
    } catch (e) {
      console.error("Error formatting end image for VEO", e);
    }
  }

  try {
    const op = await getAi(customApiKey).models.generateVideos({
      model: model,
      prompt: prompt,
      image: imagePayload,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio === '1:1' ? '9:16' : aspectRatio,
        ...(lastFramePayload ? { lastFrame: lastFramePayload } : {})
      }
    });

    if (!op) {
      throw new Error("No operation returned from generateVideos API.");
    }

    let polledOp = op;
    const maxRetries = 60;
    const delayMs = 3000;
    let attempts = 0;

    while (!polledOp.done && attempts < maxRetries) {
      attempts++;
      console.log(`Polling VEO operation (attempt ${attempts}/${maxRetries}):`, polledOp.name);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      polledOp = await getAi(customApiKey).operations.getVideosOperation({ operation: polledOp });
    }

    if (!polledOp.done) {
      throw new Error(`Video generation timed out after ${maxRetries * delayMs / 1000} seconds.`);
    }

    if (polledOp.error) {
      const errDetails = typeof polledOp.error === 'object' ? JSON.stringify(polledOp.error, null, 2) : polledOp.error;
      throw new Error(`Video generation failed with API error: ${errDetails}`);
    }

    const generatedVideos = polledOp.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      const responseStr = JSON.stringify(polledOp.response || {}, null, 2);
      throw new Error(`Video generation completed but returned no video output. Response details:\n${responseStr}`);
    }

    const videoObj = generatedVideos[0].video;
    if (!videoObj) {
      throw new Error("No video element found in response generatedVideos[0].video");
    }

    let videoUrl = "";
    if (videoObj.videoBytes) {
      const mime = videoObj.mimeType || "video/mp4";
      videoUrl = `data:${mime};base64,${videoObj.videoBytes}`;
    } else if (videoObj.uri) {
      videoUrl = videoObj.uri;
    } else {
      throw new Error("Video object contains neither videoBytes nor uri. Response: " + JSON.stringify(videoObj));
    }

    return {
      videoUrl,
      isSimulated: false,
      response: polledOp.response
    };
  } catch (err: any) {
    console.warn("VEO API failed, throwing error for client control flow", err);
    throw err;
  }
};

export const pollVideoOperation = async (operation: any, customApiKey?: string): Promise<any> => {
  try {
    return await getAi(customApiKey).operations.getVideosOperation({ operation });
  } catch (err: any) {
    console.error("Error polling video operation:", err);
    throw err;
  }
};

export const generateVoiceOverAndVideoPrompt = async (
  topic: string,
  content: string,
  visualPrompt: string,
  aspectRatio: string = '16:9',
  customApiKey?: string
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
    const response = await getAi(customApiKey).models.generateContent({
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
