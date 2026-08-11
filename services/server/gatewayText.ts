import { generateText } from "ai";
import { buildGateway } from "@/services/server/gatewayClient";

/**
 * Vercel AI Gateway text adapter (AI SDK).
 *
 * NOTE: gateway text models have no `googleSearch` grounding tool. Features
 * that depend on live search grounding (research chat, campaign generation)
 * must pass grounding context as injected text; this adapter is used for
 * free-form generation such as blog posts and generic text completion.
 *
 * `images` accepts data URLs (or Uint8Array-compatible content) and attaches
 * them to the user turn for vision-capable gateway models.
 */
export const generateTextViaGateway = async (
  modelId: string,
  prompt: string,
  system?: string,
  maxOutputTokens?: number,
  images?: string[]
): Promise<string> => {
  const gateway = buildGateway();

  const result = await generateText({
    model: gateway.languageModel(modelId),
    ...(system ? { system } : {}),
    ...(images && images.length > 0
      ? {
          messages: [{
            role: 'user' as const,
            content: [
              ...images.map((img) => ({ type: 'image' as const, image: img })),
              { type: 'text' as const, text: prompt },
            ],
          }],
        }
      : { prompt }),
    ...(maxOutputTokens ? { maxOutputTokens } : {}),
    maxRetries: 0
  });

  return result.text;
};
