export interface PublishBlogResult {
  status: number;
  ok: boolean;
  responseText: string;
}

/**
 * Publish a blog post to an external endpoint by proxying through the server
 * (`/api/blog/publish`) to avoid browser CORS restrictions on the target origin.
 */
export const publishBlogToEndpoint = async (
  targetUrl: string,
  headers: Record<string, string>,
  payload: Record<string, unknown>,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<PublishBlogResult> => {
  const response = await fetch("/api/blog/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ targetUrl, headers, payload, method })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Publish proxy failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  return {
    status: data.status,
    ok: data.success,
    responseText: data.responseText
  };
};
