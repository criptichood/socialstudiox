import { NextResponse } from "next/server";
import { publishToExternalEndpoint } from "@/services/server/blogPublishService";

export async function POST(request: Request) {
  try {
    const { targetUrl, headers, payload } = await request.json();

    if (!targetUrl || !payload) {
      return NextResponse.json({ error: "Missing required targetUrl or payload" }, { status: 400 });
    }

    const result = await publishToExternalEndpoint({ targetUrl, headers, payload });

    return NextResponse.json({
      success: result.ok,
      status: result.status,
      responseText: result.responseText
    });
  } catch (error: any) {
    console.error("API Error: Blog publish proxy failed:", error);
    return NextResponse.json({ error: error?.message || "Blog publish proxy failed" }, { status: 500 });
  }
}
