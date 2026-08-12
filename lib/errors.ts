/**
 * Client-side error classification + user-friendly message mapping.
 *
 * Every async failure in the app should be routed through `toFriendlyError`
 * so the UI shows a human-readable message while the underlying technical
 * error always goes to the console via `logTechnicalError`.
 */

export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'auth'
  | 'permission'
  | 'notfound'
  | 'validation'
  | 'ratelimit'
  | 'quota'
  | 'server'
  | 'malformed'
  | 'unknown';

export interface FriendlyErrorInfo {
  /** Human-readable message safe to show in the UI. */
  message: string;
  /** Optional secondary hint for the user. */
  detail?: string;
  kind: AppErrorKind;
}

const DEFAULT_MESSAGES: Record<AppErrorKind, string> = {
  network: "We couldn't reach the server. Check your internet connection and try again.",
  timeout: 'The request took too long and timed out. Please try again.',
  auth: 'Authentication failed. Please check your API key or credentials.',
  permission: "You don't have permission to do this. Check your API key or role.",
  notfound: "We couldn't find what you're looking for. It may have been moved or deleted.",
  validation: 'That request was invalid. Review your input and try again.',
  ratelimit: 'Too many requests. Wait a moment and try again.',
  quota: "You've reached the usage limit for this feature. Try again later or switch models.",
  server: 'Something went wrong on our side. Please try again shortly.',
  malformed: 'We received an unexpected response. Please try again.',
  unknown: 'Something unexpected went wrong. Please try again.'
};

/** Always logs the raw technical error to the console so real debugging info is preserved. */
export const logTechnicalError = (context: string, err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, err);
};

const statusKind = (status?: number): AppErrorKind | null => {
  switch (status) {
    case 400:
    case 422:
      return 'validation';
    case 401:
      return 'auth';
    case 403:
      return 'permission';
    case 404:
      return 'notfound';
    case 429:
      return 'ratelimit';
    default:
      return typeof status === 'number' && status >= 500 ? 'server' : null;
  }
};

const messageKind = (err: unknown): AppErrorKind | null => {
  const raw = String((err as any)?.message || '');
  const text = raw.toLowerCase();
  if (!text) return null;

  if (/timed?\s*out|abort|timeout/i.test(text) ) return 'timeout';
  if (/fetch failed|networkerror|failed to fetch|load failed|socket|connection refused|enetdown|econnrefused/i.test(text)) return 'network';
  if (/quota|insufficient.*quota|quota.*exceeded|permission.?denied.*quota/i.test(text)) return 'quota';
  if (/rate.?limit|too many requests/i.test(text)) return 'ratelimit';
  if (/api[ -]?key|invalid key|unauthorized|invalid credentials|authentication/i.test(text)) return 'auth';
  if (/permission.?denied|forbidden|not authorized/i.test(text)) return 'permission';
  if (/not found|404/i.test(text)) return 'notfound';
  if (/unexpected end of json|json.*parse|parse.*json|malformed|invalid json|could not parse/i.test(text)) return 'malformed';
  return null;
};

/** Map an arbitrary thrown value to an `AppErrorKind`. Falls back to 'unknown'. */
export const classifyError = (err: unknown): AppErrorKind => {
  if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'TimeoutError')) return 'timeout';

  const status = Number((err as any)?.status ?? (err as any)?.response?.status);
  const byStatus = status > 0 ? statusKind(status) : null;
  if (byStatus) return byStatus;

  return messageKind(err) || 'unknown';
};

/**
 * Turn any thrown value into a user-friendly message + technical console log.
 *
 * @param err       the thrown value (Error, fetch Response error, string…)
 * @param context   short label used for the technical console log (e.g. 'Blog-image-generate')
 * @param fallback  message to use when the error can't be classified better
 */
export const toFriendlyError = (err: unknown, context?: string, fallback?: string): FriendlyErrorInfo => {
  if (context) logTechnicalError(context, err);
  const kind = classifyError(err);
  return {
    kind,
    message: fallback && kind === 'unknown' ? fallback : DEFAULT_MESSAGES[kind]
  };
};