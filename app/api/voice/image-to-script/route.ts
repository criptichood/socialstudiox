import { NextResponse } from "next/server";
import { generateImageToScript } from "@/services/server/voiceService";

export async function POST(request: Request) {
  try {
    const { imageBase64, imagePrompt, originalPrompt, campaignContext, deliveryStyle, personaStyle } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!imageBase64 || !imagePrompt) {
      return NextResponse.json({ error: "Missing required image data or visual prompt" }, { status: 400 });
    }
    
    const script = await generateImageToScript(
      imageBase64,
      imagePrompt,
      originalPrompt,
      campaignContext,
      deliveryStyle,
      personaStyle,
      customApiKey
    );
    
    return NextResponse.json({ success: true, script });
  } catch (error: any) {
    console.error("API Error: Image-to-script narration generation failed:", error);
    return NextResponse.json({ error: error?.message || "Narration generation failed" }, { status: 500 });
  }
}
