import { NextResponse } from "next/server";
import { pollVideoOperation } from "@/services/server/videoService";
import { pollGatewayVideoGeneration } from "@/services/server/gatewayVideo";

export async function POST(request: Request) {
  try {
    const { operationName, provider } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!operationName) {
      return NextResponse.json({ error: "Missing required operationName parameter" }, { status: 400 });
    }

    if (provider === 'gateway') {
      const result = await pollGatewayVideoGeneration(operationName);
      return NextResponse.json({ success: true, ...result });
    }

    const result = await pollVideoOperation(operationName, customApiKey);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Video poll failed:", error);
    return NextResponse.json({ error: error?.message || "Failed to poll video operation" }, { status: 500 });
  }
}
