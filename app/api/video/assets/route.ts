import { NextResponse } from "next/server";
import { getAi, TEXT_MODEL } from "@/services/server/config";
import { generateInfographicImage } from "@/services/server/imageService";
import type { AspectRatio } from "@/types";

interface RawCharacter {
  name?: string;
  role?: string;
  description?: string;
  tags?: string[];
  imagePrompt?: string;
}

const MAX_CHARACTERS = 4;

export async function POST(request: Request) {
  try {
    const { prompt, aspectRatio } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter" }, { status: 400 });
    }

    const ratio: AspectRatio = (aspectRatio === '9:16' || aspectRatio === '1:1') ? aspectRatio : '16:9';

    const analysis = await getAi(customApiKey).models.generateContent({
      model: TEXT_MODEL,
      contents: `You are a character designer for AI video production. Analyze the given video prompt and extract every distinct character/person that appears on screen.

For each character output:
- name: a short label (e.g. "Business Strategist")
- role: "main" if they drive the story, otherwise "supporting"
- description: a 1-2 sentence factual description (age, gender, hair color and style, clothing, distinguishing features)
- tags: an array of short attribute strings (e.g. "male", "early 30s", "business casual", "warm natural lighting")
- imagePrompt: a detailed image-generation prompt for a CLEAN CHARACTER REFERENCE that can be used as the FIRST FRAME of a video. It MUST be photorealistic, the character centered and facing the camera in a waist-up or full-body pose, wearing EXACTLY the described outfit, in the described environment, with studio-consistent soft lighting and sharp facial features. No text, no watermark, no other people, no speech bubbles.

RULES:
1. Only extract characters that are actually described as people in the prompt. Do not invent characters.
2. If a character's appearance is not described, infer a reasonable consistent look from context and note it in the description.
3. The imagePrompt must be self-contained (no references to "the prompt"), detailed, and ready to feed directly to an image generator.
4. Return ONLY raw JSON, no markdown fences, no commentary, in EXACTLY this shape:
[{"name":"...","role":"main","description":"...","tags":["..."],"imagePrompt":"..."}]

Video prompt:
"""
${prompt}
"""`
    });

    const text = analysis.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Model returned no output" }, { status: 500 });
    }

    const characters = parseCharacters(text).slice(0, MAX_CHARACTERS);

    const assets: { id: string; name: string; role: string; description: string; tags: string[]; image: string; imagePrompt: string }[] = [];

    for (const c of characters) {
      const imagePrompt = (c.imagePrompt || "").trim();
      if (!imagePrompt) continue;
      try {
        const image = await generateInfographicImage(imagePrompt, ratio, undefined, undefined, customApiKey);
        assets.push({
          id: `asset-${Date.now()}-${assets.length}`,
          name: (c.name || "Character").trim(),
          role: (c.role || "supporting").trim(),
          description: (c.description || "").trim(),
          tags: Array.isArray(c.tags) ? c.tags.filter(Boolean).map(t => String(t).trim()) : [],
          image,
          imagePrompt
        });
      } catch (imgErr) {
        console.error("Failed to generate character asset image:", imgErr);
      }
    }

    if (assets.length === 0) {
      return NextResponse.json(
        { error: "No characters were found in this prompt (or their images could not be generated)." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error("API Error: Character asset generation failed:", error);
    return NextResponse.json({ error: error?.message || "Character asset generation failed" }, { status: 500 });
  }
}

function parseCharacters(text: string): RawCharacter[] {
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
