import { generateSpeech } from "ai";
import { buildGateway } from "@/services/server/gatewayClient";

/**
 * Vercel AI Gateway speech adapter (AI SDK).
 *
 * Gemini's native voices (Puck, Charon, ...) are not available on gateway
 * speech models. Known OpenAI voices are passed through; anything else is
 * omitted so the provider picks its default.
 */
const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

const normalizeVoice = (voice?: string): string | undefined => {
  if (!voice) return undefined;
  const lower = voice.toLowerCase();
  return OPENAI_VOICES.includes(lower) ? lower : undefined;
};

export const generateGatewaySpeech = async (
  modelId: string,
  text: string,
  voice?: string,
  instructions?: string,
  speed?: number,
  outputFormat?: 'mp3' | 'wav'
): Promise<string> => {
  const gateway = buildGateway();

  const result = await generateSpeech({
    model: gateway.speechModel(modelId),
    text,
    ...(normalizeVoice(voice) ? { voice: normalizeVoice(voice) } : {}),
    ...(instructions ? { instructions } : {}),
    ...(typeof speed === 'number' && speed > 0 ? { speed } : {}),
    ...(outputFormat ? { outputFormat } : {}),
    maxRetries: 0
  });

  const audio = result.audio;
  if (!audio?.base64) {
    throw new Error("AI Gateway returned no audio output.");
  }
  const mediaType = audio.mediaType || (outputFormat === 'wav' ? 'audio/wav' : 'audio/mpeg');
  return `data:${mediaType};base64,${audio.base64}`;
};
