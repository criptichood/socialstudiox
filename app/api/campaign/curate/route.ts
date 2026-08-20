import { NextResponse } from "next/server";
import { curateResearchBrief } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, replyContent, website, target } = body;
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!replyContent || !String(replyContent).trim()) {
      return NextResponse.json({ error: "Missing research reply content" }, { status: 400 });
    }

    const brief = await curateResearchBrief(
      typeof topic === 'string' ? topic : '',
      String(replyContent),
      typeof website === 'string' ? website : undefined,
      target === 'blog' ? 'blog' : 'campaign',
      undefined,
      customApiKey
    );

    return NextResponse.json({ success: true, brief });
  } catch (error: any) {
    console.error("[API] Campaign brief curation failed:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Campaign brief curation failed" }, { status: 500 });
  }
}