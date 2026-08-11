import { NextResponse } from "next/server";
import { buildGateway } from "@/services/server/gatewayClient";

/**
 * Live model list from the Vercel AI Gateway using the SDK's authenticated
 * `getAvailableModels()` helper. Returns the language-model catalog the
 * gateway currently serves.
 */
export async function POST() {
  try {
    const gateway = buildGateway();
    const { models } = await gateway.getAvailableModels();

    const ids = models
      .map(m => m?.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    return NextResponse.json({ success: true, modelIds: ids, count: ids.length });
  } catch (error: any) {
    console.error("API Error: Gateway model refresh failed:", error);
    return NextResponse.json({ error: error?.message || "Gateway model refresh failed" }, { status: 500 });
  }
}
