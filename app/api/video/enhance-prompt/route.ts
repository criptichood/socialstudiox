import { NextResponse } from "next/server";
import { getAi, TEXT_MODEL } from "@/services/server/config";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter" }, { status: 400 });
    }
    
    const response = await getAi(customApiKey).models.generateContent({
      model: TEXT_MODEL,
      contents: `You are an elite cinematic AI prompt engineer. Take the following simple video prompt concept: "${prompt}". Transform it into an exceptionally descriptive, highly cinematic direction prompt for a video generator like Veo. Focus on camera motion (panning, tracking shot, slow dolly), realistic physics, dynamic lighting (moody shadows, volumetric rays, high-contrast glow), rich details (ambient dust, glowing embers, high texture fidelity), and aspect ratio context. Keep it highly descriptive but concise. Return ONLY the enhanced prompt. No introduction, no markdown. Keep it under 150 words.`
    });
    
    return NextResponse.json({ success: true, text: response.text?.trim() || prompt });
  } catch (error: any) {
    console.error("API Error: Prompt enhancement failed:", error);
    return NextResponse.json({ error: error?.message || "Prompt enhancement failed" }, { status: 500 });
  }
}
