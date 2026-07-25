import { getAi, getMimeTypeAndData } from "./config";
import { Modality } from "@google/genai";

// Helper to convert base64 to Blob URL in browser context
const convertBase64ToBlobUrl = (base64Data: string, rawMimeType: string): string => {
  let mimeType = rawMimeType || "audio/mp3";
  if (mimeType === "audio/x-wav") {
    mimeType = "audio/wav";
  }

  if (typeof window !== "undefined") {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Failed to convert base64 to Blob URL, falling back to data URI", e);
    }
  }
  return `data:${mimeType};base64,${base64Data}`;
};

export const generateVoiceOverSpeech = async (
  text: string,
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' = 'Puck'
): Promise<string> => {
  try {
    const response = await getAi().models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: `Read this voiceover script aloud exactly as written, with a professional, engaging, and clear delivery. Do not add any conversational remarks, introductions, or sound effect descriptions. Read only the script: "${text}"`,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
      return convertBase64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType || "audio/mp3");
    }
    // Check other parts in case inlineData is not on the first part
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const p of parts) {
      if (p.inlineData?.data) {
        return convertBase64ToBlobUrl(p.inlineData.data, p.inlineData.mimeType || "audio/mp3");
      }
    }
    throw new Error("No inline audio data returned from Gemini");
  } catch (err) {
    console.error("Gemini TTS synthesis failed", err);
    throw err;
  }
};

/**
 * Uses Gemini's vision capability to analyze an image and generate a highly tailored 10-15s narration script.
 */
export const generateImageToScript = async (
  imageBase64: string,
  imagePrompt: string
): Promise<string> => {
  try {
    const { mimeType, data } = getMimeTypeAndData(imageBase64);
    const response = await getAi().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType, data } },
        { text: `Write a professional, premium, engaging spoken-word voiceover narration script (approx. 20-35 words) that matches the visual context, mood, and elements of this image. The image description is: "${imagePrompt}".
         Your narration script should sound like a premium social media advertisement or educational hook.
         IMPORTANT: Return ONLY the raw script text. Do NOT include any quotation marks, stage directions, or labels.` }
      ]
    });
    return response.text?.trim() || "Unlock the future with stunning visual insights, designed to elevate your perspective today.";
  } catch (err) {
    console.error("Failed to generate script from image", err);
    return "Unlock the future with stunning visual insights, designed to elevate your perspective today.";
  }
};
