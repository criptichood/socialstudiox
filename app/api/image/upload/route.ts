import { NextResponse } from "next/server";
import { uploadBase64Image } from "@/services/server/cloudinaryService";

export async function POST(request: Request) {
  try {
    const { dataUrl, folder } = await request.json();

    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Missing or invalid dataUrl parameter" }, { status: 400 });
    }

    const { url } = await uploadBase64Image(dataUrl, folder);

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("API Error: Image upload failed:", error);
    return NextResponse.json({ error: error?.message || "Image upload failed" }, { status: 500 });
  }
}
