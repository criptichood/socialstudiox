import { getAi, getGeminiApiKey, getGlobalMap, TEXT_MODEL, getMimeTypeAndData } from "@/services/server/config";
import { DEFAULT_VIDEO_MODEL, OMNI_FLASH_MODEL, VideoGenerationOptions } from "@/types";

export interface VideoGenerationResult {
  operationName?: string;
  videoUrl?: string;
  isSimulated?: boolean;
}

const activeVeoOperations = getGlobalMap<any>("veoVideoOperations");

const resolveVideoUrlFromVideo = async (videoObj: any, customApiKey?: string): Promise<string> => {
  if (videoObj.videoBytes) {
    const mime = videoObj.mimeType || "video/mp4";
    return `data:${mime};base64,${videoObj.videoBytes}`;
  }
  if (videoObj.uri) {
    const apiKey = getGeminiApiKey(customApiKey);
    const res = await fetch(videoObj.uri, {
      headers: apiKey ? { "x-goog-api-key": apiKey } : {}
    });
    if (!res.ok) {
      throw new Error(`Failed to download generated video from Gemini API: ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type") || videoObj.mimeType || "video/mp4";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  }
  throw new Error("Video object contains neither videoBytes nor uri. Response: " + JSON.stringify(videoObj));
};

const buildVideoUrlFromOperation = async (operation: any, customApiKey?: string): Promise<string> => {
  const generatedVideos = operation.response?.generatedVideos;
  if (!generatedVideos || generatedVideos.length === 0) {
    const responseStr = JSON.stringify(operation.response || {}, null, 2);
    throw new Error(`Video generation completed but returned no video output. Response details:\n${responseStr}`);
  }

  const videoObj = generatedVideos[0].video;
  if (!videoObj) {
    throw new Error("No video element found in response generatedVideos[0].video");
  }

  return resolveVideoUrlFromVideo(videoObj, customApiKey);
};

export const startVeoVideoGeneration = async (
  prompt: string,
  imageBase64?: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  model: string = DEFAULT_VIDEO_MODEL,
  customApiKey?: string,
  options: VideoGenerationOptions = {}
): Promise<{ operationName: string; operation: any }> => {
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
  if (options.endImageBase64) {
    try {
      const { mimeType, data } = getMimeTypeAndData(options.endImageBase64);
      lastFramePayload = {
        imageBytes: data,
        mimeType: mimeType
      };
    } catch (e) {
      console.error("Error formatting end image for VEO", e);
    }
  }

  const source: any = { prompt };
  if (imagePayload) {
    source.image = imagePayload;
  }

  const op = await getAi(customApiKey).models.generateVideos({
    model: model,
    source,
    config: {
      numberOfVideos: 1,
      resolution: options.resolution || '720p',
      aspectRatio: aspectRatio === '1:1' ? '9:16' : aspectRatio,
      ...(options.durationSeconds ? { durationSeconds: options.durationSeconds } : {}),
      ...(options.negativePrompt ? { negativePrompt: options.negativePrompt } : {}),
      ...(lastFramePayload ? { lastFrame: lastFramePayload } : {})
    }
  });

  if (!op || !op.name) {
    throw new Error("No operation returned from generateVideos API.");
  }

  activeVeoOperations.set(op.name, op);
  return { operationName: op.name, operation: op };
};

export const pollVideoOperation = async (
  operationName: string,
  customApiKey?: string
): Promise<{ done: boolean; videoUrl?: string; error?: string; isSimulated?: boolean }> => {
  const op = activeVeoOperations.get(operationName);
  if (!op) {
    throw new Error("Video operation not found. The server may have restarted — please try generating again.");
  }

  let polledOp: any;
  try {
    polledOp = await getAi(customApiKey).operations.getVideosOperation({ operation: op });
  } catch (err: any) {
    console.error("Error polling video operation:", err);
    throw err;
  }

  activeVeoOperations.set(operationName, polledOp);

  if (!polledOp.done) {
    return { done: false };
  }

  activeVeoOperations.delete(operationName);

  if (polledOp.error) {
    const errDetails = typeof polledOp.error === 'object' ? JSON.stringify(polledOp.error, null, 2) : polledOp.error;
    return { done: true, error: `Video generation failed with API error: ${errDetails}` };
  }

  try {
    const videoUrl = await buildVideoUrlFromOperation(polledOp, customApiKey);
    return { done: true, videoUrl, isSimulated: false };
  } catch (err: any) {
    return { done: true, error: err?.message || "Video generation returned no output." };
  }
};

const findVideoContent = (steps: any[]): any => {
  if (!Array.isArray(steps)) {
    return undefined;
  }
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step?.type !== 'model_output' || !Array.isArray(step.content)) {
      continue;
    }
    for (let j = step.content.length - 1; j >= 0; j--) {
      if (step.content[j]?.type === 'video') {
        return step.content[j];
      }
    }
  }
  return undefined;
};

const resolveOmniVideoOutput = async (interaction: any, customApiKey?: string): Promise<any> => {
  let current = interaction;
  const deadline = Date.now() + 180_000;

  while (true) {
    if (current.status === 'failed') {
      throw new Error('Gemini Omni Flash interaction failed.');
    }

    const videoContent = current.output_video || findVideoContent(current.steps);
    if (videoContent) {
      let videoUrl = '';
      if (videoContent.data) {
        videoUrl = `data:${videoContent.mime_type || 'video/mp4'};base64,${videoContent.data}`;
      } else if (videoContent.uri) {
        videoUrl = videoContent.uri;
      } else {
        throw new Error('Gemini Omni Flash video content has neither data nor uri.');
      }
      return { videoUrl, isSimulated: false, response: current };
    }

    if (!current.id || Date.now() > deadline) {
      throw new Error('Gemini Omni Flash returned no video output. Response: ' + JSON.stringify(current));
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    current = await getAi(customApiKey).interactions.get(current.id);
  }
};

export const generateOmniFlashVideo = async (
  prompt: string,
  imageBase64?: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  customApiKey?: string,
  durationSeconds?: number
): Promise<any> => {
  const input: any[] = [];

  if (imageBase64) {
    const { mimeType, data } = getMimeTypeAndData(imageBase64);
    input.push({ type: 'image', data, mime_type: mimeType });
  }

  input.push({ type: 'text', text: prompt });

  const responseFormat: any = {
    type: 'video',
    aspect_ratio: aspectRatio === '16:9' ? '16:9' : '9:16'
  };
  if (durationSeconds) {
    responseFormat.duration = `${durationSeconds}s`;
  }

  const params: any = {
    model: OMNI_FLASH_MODEL,
    input: input.length === 1 ? prompt : input,
    response_format: responseFormat
  };

  if (imageBase64) {
    params.generation_config = {
      video_config: { task: 'image_to_video' }
    };
  }

  const interaction: any = await getAi(customApiKey).interactions.create(params);

  return resolveOmniVideoOutput(interaction, customApiKey);
};

const DELIVERY_TONE_IDS = ['natural', 'conversational', 'educational', 'high_energy', 'calm_warm', 'dramatic', 'inspirational'];
const SPEECH_SPEED_IDS = ['0.8', '1.0', '1.25', '1.5', '1.75'];

export const generateVoiceOverAndVideoPrompt = async (
  topic: string,
  content: string,
  visualPrompt: string,
  aspectRatio: string = '16:9',
  campaignContext?: string,
  customApiKey?: string
): Promise<{
  voiceOver: string;
  videoPrompt: string;
  suggestedVoiceCharacter: string;
  suggestedDeliveryTone: string;
  suggestedSpeechSpeed: string;
}> => {
  const systemPrompt = `
    You are an elite audio narration director and spoken-word screenwriter for social media video.
    We are producing a spoken voiceover for: "${topic}".
    The main slide/post content or caption is: "${content}".
    The visual context is described as: "${visualPrompt}".
    The aspect ratio is ${aspectRatio}.

    ${
      campaignContext
        ? `THIS NARRATION IS PART OF A LARGER CAMPAIGN. Here is the full campaign context so you can write continuity, emotional flow, and natural transitions across the whole series:\n${campaignContext}`
        : `This is a standalone clip.`
    }

    Write a COMPELLING SPOKEN-WORD narration script — NOT plain text-to-speech. It must read like a real voice performance:
    - Embed short spoken-word direction cues in [square brackets] to guide the performer: mood, energy, pacing, emotion, laughter, suspense, warmth, pauses.
      Examples: [Warm, confident open], [playful chuckle], [slow down — building suspense], [quick, energetic], [pause for effect], [sincere close].
      Keep each cue 2-6 words. The plain text between cues is the exact words spoken aloud.
    - Give the script emotional shape: a hook opening, rising interest, a satisfying payoff, and a call-to-action close.
    ${
      campaignContext
        ? `- Weave this narration into the campaign's overall story: open by connecting to what a listener would have just heard, and naturally set up what comes next. The full series should feel like one clean, flowing spoken presentation, not disconnected clips. If this is the very first episode, include a short welcoming introduction.`
        : `- Keep it self-contained: hook, body, payoff, close.`
    }
    - Target 15-25 seconds of spoken audio for one post/slide (roughly 40-70 words). Never read hashtags, URLs, or alt-text.

    Also cast the performance and return production directions:
    - suggestedVoiceCharacter: a short casting note (gender-neutral if possible), e.g. "Warm, authoritative female storyteller with a playful spark".
    - suggestedDeliveryTone: pick ONE id from this exact list: ${DELIVERY_TONE_IDS.join(', ')}.
    - suggestedSpeechSpeed: pick ONE id from this exact list: ${SPEECH_SPEED_IDS.join(', ')}.

    Return your output ONLY as a valid JSON object:
    {
      "voiceOver": "The annotated spoken script — direction cues in [square brackets], spoken words as plain text.",
      "videoPrompt": "A highly cinematic, dynamic scene direction prompt for VEO. Describe camera movement (e.g. slow pan, dolly in, camera drift), lighting effects, motion dynamics, and high-fidelity textures.",
      "suggestedVoiceCharacter": "casting note",
      "suggestedDeliveryTone": "one id from the list",
      "suggestedSpeechSpeed": "one id from the list"
    }
  `;

  const fallback = {
    voiceOver: `[Warm, confident open] ${topic} changes the way you see things. [playful pause] Here's why it matters today. [sincere close]`,
    videoPrompt: `Cinematic camera pans across a modern sleek studio, high-key warm ambient lighting, highly detailed textures, smooth 4k render.`,
    suggestedVoiceCharacter: '',
    suggestedDeliveryTone: 'natural',
    suggestedSpeechSpeed: '1.0'
  };

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
    const parsed = JSON.parse(cleaned) as any;

    const deliveryTone = DELIVERY_TONE_IDS.includes(parsed?.suggestedDeliveryTone)
      ? parsed.suggestedDeliveryTone
      : 'natural';
    const speechSpeed = SPEECH_SPEED_IDS.includes(parsed?.suggestedSpeechSpeed)
      ? parsed.suggestedSpeechSpeed
      : '1.0';

    return {
      voiceOver: parsed?.voiceOver || fallback.voiceOver,
      videoPrompt: parsed?.videoPrompt || fallback.videoPrompt,
      suggestedVoiceCharacter: parsed?.suggestedVoiceCharacter || '',
      suggestedDeliveryTone: deliveryTone,
      suggestedSpeechSpeed: speechSpeed
    };
  } catch (err) {
    console.error("Failed to generate voiceover/video script", err);
    return fallback;
  }
};

export const enhanceVoiceOverWithGuidelines = async (
  topic: string,
  existingScript: string,
  campaignContext?: string,
  customApiKey?: string
): Promise<{
  voiceOver: string;
  suggestedVoiceCharacter: string;
  suggestedDeliveryTone: string;
  suggestedSpeechSpeed: string;
}> => {
  const systemPrompt = `
    You are an elite audio narration director and spoken-word screenwriter for social media video.
    Here is an existing voiceover script for the topic "${topic}":
    """
    ${existingScript}
    """

    Your job: transform this plain script into a PERFORMANCE-READY spoken-word script by adding narration direction guidelines — WITHOUT changing the meaning, facts, or message. Preserve the spoken content as-is (you may trim fillers and tighten rhythm, but never add new claims).

    Rules:
    - Keep the spoken lines essentially unchanged. The words between cues are the exact words spoken aloud.
    - Insert short [square-bracket] direction cues to guide how the AI should speak: mood, energy, pacing, emotion, laughter, suspense, warmth, pauses.
      Examples: [Warm, confident open], [playful chuckle], [slow down — building suspense], [quick, energetic], [pause for effect], [sincere close].
      Keep each cue 2-6 words. Spread them through the whole script so the delivery reads like a real performance.
    - Give the performance emotional shape: a hook opening, rising interest, a satisfying payoff, and a close.
    ${
      campaignContext
        ? `- Consider this campaign context for continuity across the series:\n${campaignContext}`
        : ''
    }

    Also direct the performance:
    - suggestedVoiceCharacter: a short casting note (gender-neutral if possible), e.g. "Warm, authoritative female storyteller with a playful spark".
    - suggestedDeliveryTone: pick ONE id from this exact list: ${DELIVERY_TONE_IDS.join(', ')}.
    - suggestedSpeechSpeed: pick ONE id from this exact list: ${SPEECH_SPEED_IDS.join(', ')}.

    Return your output ONLY as a valid JSON object:
    {
      "voiceOver": "The annotated spoken script — the ORIGINAL spoken words with direction cues added in [square brackets].",
      "suggestedVoiceCharacter": "casting note",
      "suggestedDeliveryTone": "one id from the list",
      "suggestedSpeechSpeed": "one id from the list"
    }
  `;

  const fallback = {
    voiceOver: existingScript,
    suggestedVoiceCharacter: '',
    suggestedDeliveryTone: 'natural',
    suggestedSpeechSpeed: '1.0'
  };

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
    const parsed = JSON.parse(cleaned) as any;

    const deliveryTone = DELIVERY_TONE_IDS.includes(parsed?.suggestedDeliveryTone)
      ? parsed.suggestedDeliveryTone
      : 'natural';
    const speechSpeed = SPEECH_SPEED_IDS.includes(parsed?.suggestedSpeechSpeed)
      ? parsed.suggestedSpeechSpeed
      : '1.0';

    return {
      voiceOver: parsed?.voiceOver || existingScript,
      suggestedVoiceCharacter: parsed?.suggestedVoiceCharacter || '',
      suggestedDeliveryTone: deliveryTone,
      suggestedSpeechSpeed: speechSpeed
    };
  } catch (err) {
    console.error("Failed to enhance voiceover script", err);
    return fallback;
  }
};
