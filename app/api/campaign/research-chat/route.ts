import { NextResponse } from "next/server";
import { conductResearchChat } from "@/services/server/campaignService";

export async function POST(request: Request) {
  try {
    const { messages, companyInfo, mode, competitorWebsite, model } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid messages parameter" }, { status: 400 });
    }
    
    const result = await conductResearchChat(
      messages,
      companyInfo,
      mode,
      competitorWebsite,
      model,
      customApiKey
    );
    
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("API Error: Research chat failed:", error);
    return NextResponse.json({ error: error?.message || "Research chat failed" }, { status: 500 });
  }
}
