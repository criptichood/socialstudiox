import { NextResponse } from "next/server";
import { suggestBlogSeo } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const { title, markdownContent, existingSlugs, backend, model } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!title || !markdownContent) {
      return NextResponse.json({ error: "Missing required title or markdownContent parameters" }, { status: 400 });
    }

    const result = await suggestBlogSeo(
      title,
      markdownContent,
      existingSlugs || [],
      customApiKey,
      backend === 'gateway' ? 'gateway' : 'gemini',
      model
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Blog SEO suggestions failed:", error);
    return NextResponse.json({ error: error?.message || "SEO suggestions failed" }, { status: 500 });
  }
}
