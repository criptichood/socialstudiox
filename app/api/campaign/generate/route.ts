import { NextResponse } from "next/server";
import { generateSocialCampaign } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteUrl, mainTopic, platform, postCount, refinementInstructions, templateName, modelName } = body;
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!websiteUrl || !mainTopic || !platform || !postCount) {
      return NextResponse.json({ error: "Missing required campaign parameters" }, { status: 400 });
    }

    const posts = await generateSocialCampaign(
      websiteUrl,
      mainTopic,
      platform,
      postCount,
      refinementInstructions,
      templateName,
      modelName,
      customApiKey
    );

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("[API] Campaign generation failed:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Campaign generation failed" }, { status: 500 });
  }
}
