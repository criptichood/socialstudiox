import { NextResponse } from "next/server";
import { suggestBlogTopics } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const { previousPosts, backend, model } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    const ideas = await suggestBlogTopics(
      previousPosts || [],
      customApiKey,
      backend === 'gateway' ? 'gateway' : 'gemini',
      model
    );

    return NextResponse.json({ success: true, ideas });
  } catch (error: any) {
    console.error("API Error: Blog topic suggestions failed:", error);
    return NextResponse.json({ error: error?.message || "Blog topic suggestions failed" }, { status: 500 });
  }
}
