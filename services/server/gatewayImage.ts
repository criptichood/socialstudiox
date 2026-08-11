import { generateImage } from "ai";
import { buildGateway } from "@/services/server/gatewayClient";
import { AspectRatio } from "@/types";

/**
 * Vercel AI Gateway image adapter (AI SDK).
 *
 * Reference-image editing is expressed as a structured prompt
 * `{ images: [...], text }`, matching the gateway image models' input shape.
 */
const buildImageDataUrl = (base64: string, mediaType: string): string =>
  `data:${mediaType || "image/png"};base64,${base64}`;

export const generateGatewayImage = async (
  modelId: string,
  prompt: string,
  aspectRatio?: AspectRatio,
  referenceImageBase64?: string
): Promise<string> => {
  const gateway = buildGateway();

  const promptInput = referenceImageBase64
    ? { images: [referenceImageBase64], text: prompt }
    : prompt;

  const result = await generateImage({
    model: gateway.imageModel(modelId),
    prompt: promptInput,
    ...(aspectRatio ? { aspectRatio } : {}),
    maxRetries: 0
  });

  const image = result.images?.[0];
  if (!image?.base64) {
    throw new Error("AI Gateway returned no image output.");
  }
  return buildImageDataUrl(image.base64, image.mediaType);
};

export const editGatewayImage = async (
  modelId: string,
  currentImageBase64: string,
  instruction: string,
  aspectRatio?: AspectRatio
): Promise<string> => {
  const gateway = buildGateway();

  const result = await generateImage({
    model: gateway.imageModel(modelId),
    prompt: {
      images: [currentImageBase64],
      text: instruction
    },
    ...(aspectRatio ? { aspectRatio } : {}),
    maxRetries: 0
  });

  const image = result.images?.[0];
  if (!image?.base64) {
    throw new Error("AI Gateway returned no edited image output.");
  }
  return buildImageDataUrl(image.base64, image.mediaType);
};
