import { createGateway } from "ai";
import { getGatewayConfig } from "@/services/server/config";

type GatewayProvider = ReturnType<typeof createGateway>;

/**
 * Shared Vercel AI Gateway client factory (AI SDK).
 *
 * Video generation needs a long timeout because the gateway `/video-model`
 * endpoint is synchronous and blocks until the clip is rendered. Text/image/
 * speech calls are short-lived, so we keep one generous timeout here to keep
 * the adapters simple.
 */
const GATEWAY_FETCH_TIMEOUT_MS = 15 * 60 * 1000;

export const buildGateway = (): GatewayProvider => {
  const { apiKey, baseURL } = getGatewayConfig();
  if (!apiKey) {
    throw new Error("AI Gateway is not configured. Add AI_GATEWAY_API_KEY to .env.local to enable gateway models.");
  }

  return createGateway({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    fetch: async (url, init) => {
      return fetch(url, {
        ...init,
        ...(init?.signal
          ? { signal: init.signal }
          : { signal: AbortSignal.timeout(GATEWAY_FETCH_TIMEOUT_MS) })
      });
    }
  });
};
