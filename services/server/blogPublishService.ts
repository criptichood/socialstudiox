export interface PublishRequestPayload {
  targetUrl: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
  /** HTTP method to use (POST for new posts, PUT/PATCH for updates by slug). */
  method?: 'POST' | 'PUT' | 'PATCH';
}

export interface PublishResult {
  status: number;
  ok: boolean;
  responseText: string;
}

/**
 * Proxy a blog publish to an external endpoint from the server.
 * Browsers enforce CORS on cross-origin requests, so the client cannot POST
 * directly to external publishing endpoints. Server-to-server requests have no
 * such restriction.
 */
export const publishToExternalEndpoint = async (req: PublishRequestPayload): Promise<PublishResult> => {
  if (!req.targetUrl || !/^https?:\/\//.test(req.targetUrl)) {
    throw new Error('Invalid endpoint URL. Must be an absolute http(s) URL.');
  }

  const method = req.method || 'POST';
  const res = await fetch(req.targetUrl, {
    method,
    headers: req.headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.payload),
    signal: AbortSignal.timeout(60000)
  });

  // Read the response body exactly ONCE, then parse defensively. Calling
  // `res.json()` and falling back to `res.text()` on the same response throws
  // "Body is unusable: Body has already been read" when the target returns a
  // non-JSON (or empty) body — e.g. a plain-text 409 from the endpoint.
  const rawText = await res.text();
  let responseText = rawText;
  try {
    const data = JSON.parse(rawText);
    if (data && typeof data === 'object') {
      responseText = data?.message || data?.error || JSON.stringify(data);
    }
  } catch {
    // Keep the raw text (HTML error pages, plain-text messages, empty body).
  }

  return { status: res.status, ok: res.ok, responseText };
};
