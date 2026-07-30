import { getAi, getMimeTypeAndData } from "@/services/ai/config";
import { Modality } from "@google/genai";

// Helper to convert ArrayBuffer/Uint8Array to base64 string safely
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper to convert PCM/linear16 raw audio bytes to a playable WAV Data URL
const convertPcmToWavDataUrl = (pcmBytes: Uint8Array, sampleRate: number): string => {
  const buffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + pcmBytes.length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (Mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, pcmBytes.length, true);

  // Copy PCM data
  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmBytes);

  const base64 = bufferToBase64(buffer);
  return `data:audio/wav;base64,${base64}`;
};

// Helper to convert base64 audio to a persistent Data URL
const convertBase64ToBlobUrl = (base64Data: string, rawMimeType: string): string => {
  let mimeType = rawMimeType || "audio/mp3";
  
  // Extract base mime type and strip extra parameters (e.g., "audio/x-wav;rate=24000")
  const baseMime = mimeType.split(";")[0].trim().toLowerCase();
  
  // Normalize mimeType for browser compatibility
  if (baseMime.includes("wav") || baseMime.includes("pcm") || baseMime.includes("linear16")) {
    mimeType = "audio/wav";
  } else if (baseMime.includes("mp3") || baseMime.includes("mpeg")) {
    mimeType = "audio/mpeg";
  } else {
    mimeType = baseMime;
  }

  try {
    const byteCharacters = atob(base64Data);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    
    const isRiffWav = byteArray[0] === 82 && byteArray[1] === 73 && byteArray[2] === 70 && byteArray[3] === 70; // 'RIFF'
    const isMp3Header = (byteArray[0] === 0x49 && byteArray[1] === 0x44 && byteArray[2] === 0x33) || (byteArray[0] === 0xFF && (byteArray[1] & 0xE0) === 0xE0);
    const isRawPcm = baseMime.includes("linear16") || baseMime.includes("pcm") || (!isRiffWav && !isMp3Header);

    // If raw linear PCM, convert to WAV Data URL with appropriate sample rate
    if (isRawPcm && !isRiffWav) {
      const rateMatch = rawMimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      return convertPcmToWavDataUrl(byteArray, sampleRate);
    }
  } catch (e) {
    console.error("Failed to parse base64 audio data, falling back to raw data URI", e);
  }

  return `data:${mimeType};base64,${base64Data}`;
};

export const generateVoiceOverSpeech = async (
  text: string,
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' = 'Puck',
  deliveryStyle?: string,
  modelName: string = 'gemini-3.1-flash-tts-preview',
  personaStyle?: string,
  accent?: string,
  speechSpeed?: string
): Promise<string> => {
  try {
    let personaInstruction = "";
    if (personaStyle) {
      const lowerP = personaStyle.toLowerCase();
      if (lowerP.includes("child") || lowerP.includes("kid")) {
        personaInstruction = "CHARACTER PERSONA: Adopt a young child's speaking voice (approx. age 6-9). Use a lighter, higher pitch, enthusiastic curiosity, and endearing playful cadence like a child explaining or asking about a concept.";
      } else if (lowerP.includes("anime_hero") || lowerP.includes("hero")) {
        personaInstruction = "CHARACTER PERSONA: Adopt an energetic Anime Hero / Protagonist English Dub voice. Use intense determination, crisp punchy phrasing, dynamic vocal projection, and passionate character energy.";
      } else if (lowerP.includes("anime_mascot") || lowerP.includes("mascot") || lowerP.includes("chibi")) {
        personaInstruction = "CHARACTER PERSONA: Adopt a cute Anime Chibi / Mascot character voice. Higher pitched, bright, bouncy, enthusiastic, and charmingly expressive.";
      } else if (lowerP.includes("anime") || lowerP.includes("cartoon")) {
        personaInstruction = "CHARACTER PERSONA: Adopt an animated anime / cartoon character style. Use dynamic pitch variation, expressive enthusiasm, animated character cadence, and stylized vocal flair.";
      } else if (lowerP.includes("teen") || lowerP.includes("youth")) {
        personaInstruction = "CHARACTER PERSONA: Adopt a young teenager / youth voice. Use a casual, energetic, upbeat student cadence.";
      } else if (lowerP.includes("senior") || lowerP.includes("elder")) {
        personaInstruction = "CHARACTER PERSONA: Adopt a mature senior / elder voice. Use a warm, gentle, wise elder cadence with relaxed, experienced pacing.";
      } else {
        personaInstruction = "CHARACTER PERSONA: Read in a natural adult voice.";
      }
    }

    let accentInstruction = "";
    if (accent) {
      const lowerAcc = accent.toLowerCase();
      if (lowerAcc.includes("anime") || lowerAcc.includes("dub") || lowerAcc.includes("japanese")) {
        accentInstruction = "ACCENT & STYLE: Speak in a distinct English Anime Dub style (Japanese localization style). Articulate with crisp consonant attacks, stylized melodic pitch contours, energetic vocal enthusiasm, and iconic dub inflection.";
      } else if (!lowerAcc.includes("us standard")) {
        accentInstruction = `ACCENT: Speak with an authentic ${accent} accent and natural regional pronunciation.`;
      }
    }

    let toneInstruction = "";
    if (deliveryStyle && !deliveryStyle.toLowerCase().includes("natural")) {
      toneInstruction = `DELIVERY TONE: Deliver this with a ${deliveryStyle} tone and style. Modulate your pitch, pacing, and emotional nuance accordingly.`;
    } else {
      toneInstruction = "DELIVERY TONE: Speak in a natural, conversational, and fluid tone without any forced inspirational speaker cadence or artificial broadcast inflection. Let your voice respond organically to the words, punctuation, and emotion embedded in the script itself. If the script contains emotional tags like [Joyful], [Laughter], [Sad], or [Curious], express those natural emotional states directly.";
    }

    let speedInstruction = "";
    if (speechSpeed) {
      const spd = parseFloat(speechSpeed) || 1.0;
      if (spd >= 1.4) {
        speedInstruction = `SPEAKING SPEED: Rapid / Fast pace (${spd}x speed). Deliver words with brisk, swift articulation and quick transitions without lingering on syllables.`;
      } else if (spd >= 1.15) {
        speedInstruction = `SPEAKING SPEED: Upbeat / Snappy pace (${spd}x speed). Maintain energetic, slightly brisk pacing.`;
      } else if (spd <= 0.85) {
        speedInstruction = `SPEAKING SPEED: Slow / Relaxed pace (${spd}x speed). Deliver words with deliberate, unhurried pacing and spacious breath pauses.`;
      } else {
        speedInstruction = `SPEAKING SPEED: Standard 1.0x natural speaking speed.`;
      }
    }

    const fullInstruction = [personaInstruction, accentInstruction, toneInstruction, speedInstruction].filter(Boolean).join("\n");

    const response = await getAi().models.generateContent({
      model: modelName,
      contents: `Read this voiceover script aloud exactly as written.
      
      ${fullInstruction}
      
      CRITICAL RULE: Read ONLY the spoken text below. Do NOT add conversational remarks, meta-intros, or read stage tags aloud:
      "${text}"`,
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
    if (part?.inlineData?.data) {
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
  imagePrompt: string,
  originalPrompt?: string,
  campaignContext?: string,
  deliveryStyle?: string,
  personaStyle?: string
): Promise<string> => {
  try {
    const { mimeType, data } = getMimeTypeAndData(imageBase64);
    const response = await getAi().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType, data } },
        { text: `Write a natural, engaging spoken-word voiceover narration script (approx. 20-35 words) matching this visual.
         
         CONTEXT:
         - Visual elements of this image: "${imagePrompt}"
         - Concept/Goal: "${originalPrompt || 'Creative post'}"
         ${campaignContext ? `- Campaign / Brand Context: "${campaignContext}"` : ''}
         ${personaStyle ? `- Speaker Persona: "${personaStyle}"` : ''}
         ${deliveryStyle ? `- Delivery Tone / Style: "${deliveryStyle}"` : ''}
         
         IMPORTANT INSTRUCTIONS:
         1. Start the script with a brief emotion/tone tag at the beginning if relevant (e.g., "[Tone: Natural, Friendly]" or "[Emotion: Playful, Curious]").
         2. Make the script sound completely natural, conversational, and authentic for the character/speaker matching the visual. Do NOT force cliché inspirational speech phrases.
         3. Keep it punchy, rhythmic, and clear (15-25 seconds spoken).
         4. Return the script text only. Do NOT include speaker labels like "Narrator:".` }
      ]
    });
    return response.text?.trim() || "[Tone: Natural, Friendly]\nHere is a closer look at how modern tools bring creative ideas to life smoothly.";
  } catch (err) {
    console.error("Failed to generate script from image", err);
    return "[Tone: Natural, Friendly]\nHere is a closer look at how modern tools bring creative ideas to life smoothly.";
  }
};
