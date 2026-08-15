export interface PublishRequestPayload {
  targetUrl: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
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

  const res = await fetch(req.targetUrl, {
    method: 'POST',
    headers: req.headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.payload),
    signal: AbortSignal.timeout(60000)
  });

  let responseText = '';
  try {
    const data = await res.json();
    responseText = data?.message || data?.error || JSON.stringify(data);
  } catch {
    responseText = await res.text();
  }

  return { status: res.status, ok: res.ok, responseText };
};
