import { NextResponse } from "next/server";
import { getAi, TEXT_MODEL } from "@/services/server/config";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
    
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter" }, { status: 400 });
    }
    
    const response = await getAi(customApiKey).models.generateContent({
      model: TEXT_MODEL,
      contents: `You are an elite cinematic prompt engineer for AI video generators like Veo.

You will be given a video prompt that may contain several sections: Objective, Visual Direction, Spoken Script, Speech Guide, and Camera notes. Your job is to ENHANCE it, not rewrite it.

RULES — NON-NEGOTIABLE:
1. Preserve the intent and goal exactly. Never change the purpose, the audience, the message, or the emotional objective.
2. Preserve ALL key details verbatim: named companies/brands, locations and regions, specific industries and subjects, the FULL spoken script and any quoted dialogue, and any constraints (e.g. "no text overlays", "warm natural lighting", "medium close-up", aspect ratio).
3. Preserve the section structure and pacing of the original. Do not remove, merge, or reorder sections.
4. Only enrich the CINEMATIC EXECUTION: camera motion, framing, lighting quality, atmosphere, transitions, depth of field, texture and fidelity. Expand each described shot with richer visual direction — but never invent new shots, new characters, new plot, or drop existing ones.
5. Keep it a single continuous prompt. Return ONLY the enhanced prompt text. No introductions, no markdown, no commentary.
6. Be comprehensive — do not truncate to a word limit if it would cause you to drop the script or any named details.

Original prompt:
"""
${prompt}
"""

Enhanced prompt:`
    });
    
    return NextResponse.json({ success: true, text: response.text?.trim() || prompt });
  } catch (error: any) {
    console.error("API Error: Prompt enhancement failed:", error);
    return NextResponse.json({ error: error?.message || "Prompt enhancement failed" }, { status: 500 });
  }
}
