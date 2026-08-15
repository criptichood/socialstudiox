import { NextResponse } from "next/server";
import { getAi, TEXT_MODEL } from "@/services/server/config";

interface RawSegment {
  index?: number;
  title?: string;
  estimatedSeconds?: number;
  prompt?: string;
}

export async function POST(request: Request) {
  try {
    const { prompt, maxDurationSeconds } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter" }, { status: 400 });
    }

    const maxDuration = Math.min(Math.max(Number(maxDurationSeconds) || 8, 4), 15);

    const response = await getAi(customApiKey).models.generateContent({
      model: TEXT_MODEL,
      contents: `You are an elite cinematic AI video director. You will receive a full video prompt that is too long to fit in a single AI video generation. Each generation can only produce up to ${maxDuration} seconds of screen time. Break the prompt into chronological segments of ${maxDuration} seconds or less, so they can be generated one at a time and stitched into one continuous, consistent story.

RULES — NON-NEGOTIABLE:
1. Read the entire prompt and identify the natural scene and story beats (establishing shot, character intro, dialogue beats, transitions, product/feature reveals, call-to-action). Split AT those beats so every segment is self-contained and ends at a natural cut that continues smoothly into the next part.
2. Each segment must be its own complete cinematic video prompt. Keep the same structure as the original where present (Objective, Visual Direction, Spoken Script, Speech Guide, Camera). Include ONLY the content that belongs in that segment — move later story content to later segments.
3. CHARACTER & STYLE CONSISTENCY IS THE MOST IMPORTANT RULE. If the same character continues across segments (a single continuous story), every later segment MUST explicitly open with a continuation anchor: restate the exact character anchors (same person: appearance, age, wardrobe, facial features; same setting, lighting, and aesthetic) and begin with "CONTINUATION FROM PART N" describing precisely what happened before, so the generator produces the identical character and flow. Never change the character unless the original prompt explicitly introduces a new one.
4. SPEECH & VOICE CONSISTENCY. The video generator attaches audio to each clip, so the SAME speaker must keep the SAME voice across every segment. In each segment's Speech Guide, explicitly state who is speaking and, when it is the same character as a previous part, demand the identical voice: same gender, tone, warmth, pitch, accent, and pacing — e.g. "The SAME male voice as Part N, warm, confident, conversational." Only introduce a different voice if the original prompt explicitly has a different character speak (e.g. "a female character chimes in") — and in that case describe that new voice clearly in that segment's Speech Guide.
5. Split the spoken script naturally across the segments so dialogue flows across cuts without being cut mid-sentence, and so each segment's on-screen speaker matches who is actually talking in that part of the story.
6. REFINE, DO NOT JUST CUT. After deciding where to split, review every segment as a final director's pass. Fix anything that would render poorly on its own: sharpen vague visual language, tighten the camera/lighting description, ensure the segment opens cleanly (not mid-action) and closes on a natural cut, make the segment's own beats feel complete within its time budget, and keep the continuity/voice anchors intact. Minor polish is expected and encouraged. Do NOT change the story, add new shots/characters/plot, or remove existing details — only make each segment read better and generate more reliably.
7. Preserve all named details (brands, locations, industries) in the segments where they belong, and preserve constraints like "no text overlays".
8. Return ONLY raw JSON, no markdown fences, no commentary, in EXACTLY this shape:
[{"index":1,"title":"Short descriptive title","estimatedSeconds":${maxDuration},"prompt":"Full cinematic prompt for this segment"}, ...]

The estimatedSeconds of every segment must be ${maxDuration} or less. Do not invent shots or characters that are not in the original prompt.

Original prompt:
"""
${prompt}
"""`
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Model returned no output" }, { status: 500 });
    }

    const segments = parseSegments(text).map((s: RawSegment, i: number) => ({
      index: i + 1,
      title: s.title?.trim() || `Part ${i + 1}`,
      estimatedSeconds: Math.min(Math.max(Number(s.estimatedSeconds) || maxDuration, 1), maxDuration),
      prompt: (s.prompt || "").trim()
    })).filter((s: { prompt: string }) => s.prompt.length > 0);

    if (segments.length === 0) {
      return NextResponse.json({ error: "Could not split the prompt into segments" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      segments,
      totalSeconds: segments.reduce((sum: number, s: { estimatedSeconds: number }) => sum + s.estimatedSeconds, 0)
    });
  } catch (error: any) {
    console.error("API Error: Prompt segmentation failed:", error);
    return NextResponse.json({ error: error?.message || "Prompt segmentation failed" }, { status: 500 });
  }
}

function parseSegments(text: string): RawSegment[] {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array found in model output");
  }
  const parsed = JSON.parse(candidate.slice(start, end + 1));
  return Array.isArray(parsed) ? parsed : [parsed];
}
