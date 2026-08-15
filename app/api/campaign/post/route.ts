import { NextResponse } from "next/server";
import { generateSingleSocialPost, refineSingleSocialPost } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const { action, websiteUrl, campaignTopic, platform, customInstructions, existingPostsCount, modelName, currentPost, refineInstruction } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (action === "generate") {
      if (!websiteUrl || !campaignTopic || !platform || !customInstructions) {
        return NextResponse.json({ error: "Missing parameters for post generation" }, { status: 400 });
      }
      
      const post = await generateSingleSocialPost(
        websiteUrl,
        campaignTopic,
        platform,
        customInstructions,
        existingPostsCount || 0,
        modelName,
        customApiKey
      );
      return NextResponse.json({ success: true, post });
    } else if (action === "refine") {
      if (!currentPost || !refineInstruction || !platform) {
        return NextResponse.json({ error: "Missing parameters for post refinement" }, { status: 400 });
      }
      
      const post = await refineSingleSocialPost(
        currentPost,
        refineInstruction,
        platform,
        modelName,
        customApiKey
      );
      return NextResponse.json({ success: true, post });
    } else {
      return NextResponse.json({ error: "Invalid action. Must be 'generate' or 'refine'" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("API Error: Post action failed:", error);
    return NextResponse.json({ error: error?.message || "Post action failed" }, { status: 500 });
  }
}
