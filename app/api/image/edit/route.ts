import { NextResponse } from "next/server";
import { editInfographicImage, fixInfographicImage } from "@/services/server/imageService";
import { editGatewayImage } from "@/services/server/gatewayImage";

export async function POST(request: Request) {
  try {
    const { currentImageBase64, correctionPrompt, editInstruction, model, backend } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!currentImageBase64) {
      return NextResponse.json({ error: "Missing currentImageBase64 parameter" }, { status: 400 });
    }
    
    const instruction = editInstruction || correctionPrompt;
    if (!instruction) {
      return NextResponse.json({ error: "Provide either editInstruction or correctionPrompt" }, { status: 400 });
    }
    
    let imageUrl = "";
    if (backend === 'gateway') {
      imageUrl = await editGatewayImage(model, currentImageBase64, instruction);
    } else if (editInstruction) {
      imageUrl = await editInfographicImage(currentImageBase64, editInstruction, customApiKey);
    } else {
      imageUrl = await fixInfographicImage(currentImageBase64, correctionPrompt, customApiKey);
    }
    
    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("API Error: Image editing failed:", error);
    return NextResponse.json({ error: error?.message || "Image editing failed" }, { status: 500 });
  }
}
