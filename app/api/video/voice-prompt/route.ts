import { NextResponse } from "next/server";
import { generateVoiceOverAndVideoPrompt } from "@/services/server/videoService";

export async function POST(request: Request) {
  try {
    const { topic, content, visualPrompt, aspectRatio, campaignContext } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!topic || !content || !visualPrompt) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    const result = await generateVoiceOverAndVideoPrompt(
      topic,
      content,
      visualPrompt,
      aspectRatio,
      campaignContext,
      customApiKey
    );
    
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Video prompt/voiceover generation failed:", error);
    return NextResponse.json({ error: error?.message || "Generation failed" }, { status: 500 });
  }
}
