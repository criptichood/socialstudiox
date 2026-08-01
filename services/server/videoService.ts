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
