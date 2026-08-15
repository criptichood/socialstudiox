import { NextResponse } from "next/server";
import { enhanceVoiceOverWithGuidelines } from "@/services/server/videoService";

export async function POST(request: Request) {
  try {
    const { topic, existingScript, campaignContext } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!topic || !existingScript) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const result = await enhanceVoiceOverWithGuidelines(
      topic,
      existingScript,
      campaignContext,
      customApiKey
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Voiceover enhancement failed:", error);
    return NextResponse.json({ error: error?.message || "Enhancement failed" }, { status: 500 });
  }
}
