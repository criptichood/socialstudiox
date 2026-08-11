import { NextResponse } from "next/server";
import { generateInfographicImage } from "@/services/server/imageService";

export async function POST(request: Request) {
  try {
    const { prompt, resolution, referenceImageBase64, referenceMode, model } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!prompt) {
      return NextResponse.json({ error: "Missing required prompt parameter" }, { status: 400 });
    }
    
    const imageUrl = await generateInfographicImage(
      prompt,
      resolution,
      referenceImageBase64,
      referenceMode,
      customApiKey,
      model
    );
    
    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("API Error: Image generation failed:", error);
    return NextResponse.json({ error: error?.message || "Image generation failed" }, { status: 500 });
  }
}
