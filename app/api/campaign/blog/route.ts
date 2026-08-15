import { NextResponse } from "next/server";
import { generateBlogPostFromCampaign } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const { topic, campaignSummary, availableImages, companyContext, targetTone, targetWordCount, targetAudience, seoKeywords, previousPosts, backend, model, siteBaseUrl, nodeDiagramsEnabled } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!topic || !campaignSummary) {
      return NextResponse.json({ error: "Missing required topic or campaignSummary parameters" }, { status: 400 });
    }
    
    const result = await generateBlogPostFromCampaign(
      topic,
      campaignSummary,
      availableImages || [],
      companyContext || "",
      targetTone || "Informative, Authoritative & Actionable Guide",
      targetWordCount || 1200,
      targetAudience || "General / Mixed Audience",
      seoKeywords || [],
      previousPosts || [],
      customApiKey,
      backend === 'gateway' ? 'gateway' : 'gemini',
      model,
      siteBaseUrl || '',
      nodeDiagramsEnabled !== false
    );
    
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Blog generation failed:", error);
    return NextResponse.json({ error: error?.message || "Blog generation failed" }, { status: 500 });
  }
}
