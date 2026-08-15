import { NextResponse } from "next/server";
import { getAi, TEXT_MODEL } from "@/services/server/config";

export async function POST(request: Request) {
  try {
    const { lastSegmentPrompt, content, maxDurationSeconds } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!content) {
      return NextResponse.json({ error: "Missing content parameter" }, { status: 400 });
    }

    const maxDuration = Math.min(Math.max(Number(maxDurationSeconds) || 8, 4), 15);

    const response = await getAi(customApiKey).models.generateContent({
      model: TEXT_MODEL,
      contents: `You are an elite cinematic AI video director continuing a story that is being generated one clip at a time. Each clip can only be up to ${maxDuration} seconds of screen time. You are given the prompt of the segment that just played, and new content that must come next.

Write the NEXT segment as its own complete cinematic video prompt, structured like the original (Objective, Visual Direction, Spoken Script, Speech Guide, Camera where applicable).

RULES — NON-NEGOTIABLE:
1. Open with "CONTINUATION FROM PART N" and explicitly restate the exact character anchors from the previous segment (same person: appearance, age, wardrobe, facial features; same setting, lighting, and aesthetic) so the same character continues seamlessly. Never change the character unless the new content explicitly introduces a different one.
2. SPEECH & VOICE CONSISTENCY. State in the Speech Guide that this is the SAME voice as the previous part (same gender, tone, warmth, pitch, accent, pacing) whenever the same character keeps talking. Only describe a different voice if the new content explicitly has another character speak.
3. Include ONLY the new content, paced so it fits within ${maxDuration} seconds. Split the spoken script naturally — no mid-sentence cuts.
4. REFINE, DO NOT JUST PASTE. Polish the new content into sharp cinematic prose: tighten visuals, camera motion, and lighting; make the segment open cleanly and end at a natural cut that hands off to the next part; keep continuity and voice anchors intact. Do not add new shots, characters, or plot that are not in the content.
5. Preserve all named details (brands, locations, industries) and constraints like "no text overlays".
6. Return ONLY raw JSON, no markdown fences, no commentary, in EXACTLY this shape:
{"index":1,"title":"Short descriptive title","estimatedSeconds":${maxDuration},"prompt":"Full cinematic continuation prompt for this segment"}

Previous segment prompt:
"""
${lastSegmentPrompt || "None — this is the start of the story."}
"""

New content for the next segment:
"""
${content}
"""`,
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Model returned no output" }, { status: 500 });
    }

    const parsed = parseSingleObject(text);
    const prompt = String(parsed.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Could not produce a continuation prompt" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      title: String(parsed.title || "").trim() || "New Part",
      estimatedSeconds: Math.min(Math.max(Number(parsed.estimatedSeconds) || maxDuration, 1), maxDuration),
      prompt
    });
  } catch (error: any) {
    console.error("API Error: Continuation refinement failed:", error);
    return NextResponse.json({ error: error?.message || "Continuation refinement failed" }, { status: 500 });
  }
}

function parseSingleObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
