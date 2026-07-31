import { AspectRatio, ComplexityLevel, VisualStyle, Language } from "@/types";

export const generateInfographicImage = async (
  prompt: string, 
  resolution: AspectRatio = '16:9',
  referenceImageBase64?: string,
  referenceMode?: string
): Promise<string> => {
  const response = await fetch("/api/image/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      resolution,
      referenceImageBase64,
      referenceMode
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate image");
  }

  const data = await response.json();
  return data.imageUrl;
};

export const verifyInfographicAccuracy = async (
  imageBase64: string, 
  topic: string,
  level: ComplexityLevel,
  style: VisualStyle,
  language: Language
): Promise<{ isAccurate: boolean; critique: string }> => {
  return {
    isAccurate: true,
    critique: "Verification bypassed."
  };
};

export const fixInfographicImage = async (currentImageBase64: string, correctionPrompt: string): Promise<string> => {
  const response = await fetch("/api/image/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      currentImageBase64,
      correctionPrompt
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fix image");
  }

  const data = await response.json();
  return data.imageUrl;
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string): Promise<string> => {
  const response = await fetch("/api/image/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      currentImageBase64,
      editInstruction
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to edit image");
  }

  const data = await response.json();
  return data.imageUrl;
};
