import { NextResponse } from "next/server";
import { editInfographicImage, fixInfographicImage } from "@/services/server/imageService";

export async function POST(request: Request) {
  try {
    const { currentImageBase64, correctionPrompt, editInstruction } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!currentImageBase64) {
      return NextResponse.json({ error: "Missing currentImageBase64 parameter" }, { status: 400 });
    }
    
    let imageUrl = "";
    if (editInstruction) {
      imageUrl = await editInfographicImage(currentImageBase64, editInstruction, customApiKey);
    } else if (correctionPrompt) {
      imageUrl = await fixInfographicImage(currentImageBase64, correctionPrompt, customApiKey);
    } else {
      return NextResponse.json({ error: "Provide either editInstruction or correctionPrompt" }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("API Error: Image editing failed:", error);
    return NextResponse.json({ error: error?.message || "Image editing failed" }, { status: 500 });
  }
}
