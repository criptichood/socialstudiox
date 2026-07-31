import { NextResponse } from "next/server";
import { generateVoiceOverSpeech } from "@/services/server/voiceService";

export async function POST(request: Request) {
  try {
    const { text, voiceName, deliveryStyle, modelName, personaStyle, accent, speechSpeed } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!text) {
      return NextResponse.json({ error: "Missing required text parameter" }, { status: 400 });
    }
    
    const audioDataUrl = await generateVoiceOverSpeech(
      text,
      voiceName,
      deliveryStyle,
      modelName,
      personaStyle,
      accent,
      speechSpeed,
      customApiKey
    );
    
    return NextResponse.json({ success: true, audioUrl: audioDataUrl });
  } catch (error: any) {
    console.error("API Error: Voice synthesis failed:", error);
    return NextResponse.json({ error: error?.message || "Voice synthesis failed" }, { status: 500 });
  }
}
