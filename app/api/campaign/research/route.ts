import { NextResponse } from "next/server";
import { researchTopicForPrompt } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const { topic, level, style, language, resolution, subOptions } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!topic) {
      return NextResponse.json({ error: "Missing required topic parameter" }, { status: 400 });
    }
    
    const result = await researchTopicForPrompt(
      topic,
      level,
      style,
      language,
      resolution,
      subOptions,
      customApiKey
    );
    
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Campaign research failed:", error);
    return NextResponse.json({ error: error?.message || "Campaign research failed" }, { status: 500 });
  }
}
