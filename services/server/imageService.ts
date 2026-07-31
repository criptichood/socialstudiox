import { Modality } from "@google/genai";
import { AspectRatio, ComplexityLevel, VisualStyle, Language } from "@/types";
import { getAi, IMAGE_MODEL, EDIT_MODEL, getMimeTypeAndData } from "@/services/server/config";

/**
 * Gemini image models (gemini-*-image) do NOT support the `aspectRatio` config field —
 * that parameter is only supported by Imagen models. For Gemini image models, orientation
 * must be driven via the prompt text itself.
 */
const buildAspectInstruction = (resolution: AspectRatio): string => {
  switch (resolution) {
    case '9:16':
      return 'IMPORTANT: Generate this image in PORTRAIT orientation (9:16 aspect ratio, taller than wide, like a mobile phone screen / Instagram Story / TikTok frame). The canvas should be significantly taller than it is wide.';
    case '16:9':
      return 'IMPORTANT: Generate this image in LANDSCAPE / WIDESCREEN orientation (16:9 aspect ratio, wider than tall, like a YouTube thumbnail or desktop wallpaper). The canvas should be significantly wider than it is tall.';
    case '1:1':
    default:
      return 'IMPORTANT: Generate this image in SQUARE format (1:1 aspect ratio, equal width and height, like an Instagram post or profile picture).';
  }
};

export const generateInfographicImage = async (
  prompt: string, 
  resolution: AspectRatio = '16:9',
  referenceImageBase64?: string,
  referenceMode?: string,
  customApiKey?: string
): Promise<string> => {
  const aspectInstruction = buildAspectInstruction(resolution);
  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
  
  if (referenceImageBase64) {
    const cleanBase64 = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64
      }
    });
    
    let modePrompt = "";
    if (referenceMode === 'background') {
      modePrompt = "Use the supplied reference image as the primary subject. Remove/replace its original background and render a stunning new background matching this detailed description, keeping the main subject unchanged: ";
    } else if (referenceMode === 'style') {
      modePrompt = "Create a brand new infographic visual. Adopt the color palette, artistic style, layout aesthetics, and overall mood of this reference image. Visual description: ";
    } else {
      modePrompt = "Use this reference image as a layout composition and anatomical skeleton template. Build and annotate on top of this exact composition according to: ";
    }
    parts.push({ text: `${aspectInstruction}\n\n${modePrompt}${prompt}` });
  } else {
    parts.push({ text: `${aspectInstruction}\n\n${prompt}` });
  }

  const response = await getAi(customApiKey).models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: parts
    },
    config: {
      responseModalities: [Modality.IMAGE],
    } as any
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to generate image");
};


export const verifyInfographicAccuracy = async (
  imageBase64: string, 
  topic: string,
  level: ComplexityLevel,
  style: VisualStyle,
  language: Language,
  customApiKey?: string
): Promise<{ isAccurate: boolean; critique: string }> => {
  return {
    isAccurate: true,
    critique: "Verification bypassed."
  };
};

export const fixInfographicImage = async (
  currentImageBase64: string, 
  correctionPrompt: string,
  customApiKey?: string
): Promise<string> => {
  const { mimeType, data: cleanBase64 } = getMimeTypeAndData(currentImageBase64);

  const prompt = `
    Edit this image. 
    Goal: Simplify and Fix.
    Instruction: ${correctionPrompt}.
    Ensure the design is clean and any text is large and legible.
  `;

  const response = await getAi(customApiKey).models.generateContent({
    model: EDIT_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType, data: cleanBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE],
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to fix image");
};

export const editInfographicImage = async (
  currentImageBase64: string, 
  editInstruction: string,
  customApiKey?: string
): Promise<string> => {
  const { mimeType, data: cleanBase64 } = getMimeTypeAndData(currentImageBase64);
  
  const response = await getAi(customApiKey).models.generateContent({
    model: EDIT_MODEL,
    contents: {
      parts: [
         { inlineData: { mimeType, data: cleanBase64 } },
         { text: editInstruction }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE],
    }
  });
  
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to edit image");
};
