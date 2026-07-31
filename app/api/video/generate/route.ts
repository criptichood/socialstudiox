import { NextResponse } from "next/server";
import { generateVeoVideo } from "@/services/server/videoService";

export async function POST(request: Request) {
  try {
    const { prompt, imageBase64, aspectRatio, model, endImageBase64 } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!prompt) {
      return NextResponse.json({ error: "Missing required prompt parameter" }, { status: 400 });
    }
    
    const result = await generateVeoVideo(
      prompt,
      imageBase64,
      aspectRatio,
      model,
      endImageBase64,
      customApiKey
    );
    
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Video generation failed:", error);
    return NextResponse.json({ error: error?.message || "Video generation failed" }, { status: 500 });
  }
}
