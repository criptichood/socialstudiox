import { NextResponse } from "next/server";
import { conductResearchChat, type ResearchChatPhase } from "@/services/server/campaignService";

const encoder = new TextEncoder();

function sse(data: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const { messages, companyInfo, mode, competitorWebsite, model, groundingEnabled, backend, imageUrls, nodeDiagramsEnabled } = await request.json();
  const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing or invalid messages parameter" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onPhase = (phase: ResearchChatPhase) => {
        controller.enqueue(sse({ phase }));
      };

      try {
        const result = await conductResearchChat(
          messages,
          companyInfo,
          mode,
          competitorWebsite,
          model,
          customApiKey,
          groundingEnabled !== false,
          backend === 'gateway' ? 'gateway' : 'gemini',
          imageUrls,
          onPhase,
          nodeDiagramsEnabled !== false
        );
        controller.enqueue(sse({ success: true, ...result }));
      } catch (error: any) {
        console.error("API Error: Research chat failed:", error);
        controller.enqueue(sse({ error: error?.message || "Research chat failed" }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
