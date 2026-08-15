import { NextResponse } from "next/server";
import { ModelBackend, ModelModality } from "@/types";
import { getAi } from "@/services/server/config";
import { generateTextViaGateway } from "@/services/server/gatewayText";
import { generateGatewayImage } from "@/services/server/gatewayImage";
import { generateGatewaySpeech } from "@/services/server/gatewaySpeech";
import { generateInfographicImage } from "@/services/server/imageService";
import { generateVoiceOverSpeech } from "@/services/server/voiceService";

const TEST_PROMPT = "A minimal test image: a single small blue dot centered on a pure white background. No text, no other shapes.";

async function verifyGemini(modality: ModelModality, model: string, customApiKey?: string): Promise<void> {
  const ai = getAi(customApiKey);
  switch (modality) {
    case 'text': {
      await ai.models.generateContent({ model, contents: 'Reply with exactly the single word: ok' });
      return;
    }
    case 'image':
    case 'image-edit': {
      await generateInfographicImage(TEST_PROMPT, '1:1', undefined, undefined, customApiKey, model);
      return;
    }
    case 'voice': {
      await generateVoiceOverSpeech('Testing.', 'Puck', 'natural', model, undefined, undefined, undefined, customApiKey);
      return;
    }
    default:
      throw new Error("Video models cannot be tested here. Generate a clip in Video Studio instead.");
  }
}

async function verifyGateway(modality: ModelModality, model: string): Promise<void> {
  switch (modality) {
    case 'text':
      await generateTextViaGateway(model, 'Reply with exactly the single word: ok');
      return;
    case 'image':
    case 'image-edit':
      await generateGatewayImage(model, TEST_PROMPT, '1:1');
      return;
    case 'voice':
      await generateGatewaySpeech(model, 'Testing.');
      return;
    default:
      throw new Error("Video models cannot be tested here. Generate a clip in Video Studio instead.");
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const { modality, backend, model } = await request.json();
    const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

    if (!modality || !model) {
      return NextResponse.json({ error: "Missing required modality or model parameter" }, { status: 400 });
    }

    const resolvedBackend: ModelBackend = backend === 'gateway' ? 'gateway' : 'gemini';

    if (resolvedBackend === 'gateway') {
      await verifyGateway(modality, model);
    } else {
      await verifyGemini(modality, model, customApiKey);
    }

    return NextResponse.json({ success: true, latencyMs: Date.now() - startedAt });
  } catch (error: any) {
    console.error("API Error: Model verification failed:", error);
    return NextResponse.json({ error: error?.message || "Model verification failed" }, { status: 500 });
  }
}
