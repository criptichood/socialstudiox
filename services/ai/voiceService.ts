export const generateVoiceOverSpeech = async (
  text: string,
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' = 'Puck',
  deliveryStyle?: string,
  modelName: string = 'gemini-3.1-flash-tts-preview',
  personaStyle?: string,
  accent?: string,
  speechSpeed?: string
): Promise<string> => {
  const response = await fetch("/api/voice/synthesize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      voiceName,
      deliveryStyle,
      modelName,
      personaStyle,
      accent,
      speechSpeed
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to synthesize voiceover");
  }

  const data = await response.json();
  return data.audioUrl;
};

export const generateImageToScript = async (
  imageBase64: string,
  imagePrompt: string,
  originalPrompt?: string,
  campaignContext?: string,
  deliveryStyle?: string,
  personaStyle?: string
): Promise<string> => {
  const response = await fetch("/api/voice/image-to-script", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      imageBase64,
      imagePrompt,
      originalPrompt,
      campaignContext,
      deliveryStyle,
      personaStyle
    })
  });

  if (!response.ok) {
    return "[Tone: Natural, Friendly]\nHere is a closer look at how modern tools bring creative ideas to life smoothly.";
  }

  const data = await response.json();
  return data.script;
};
