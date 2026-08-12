import { toast } from 'sonner';
import { toFriendlyError, logTechnicalError } from '@/lib/errors';

export const notifySuccess = (message: string, description?: string) => {
  toast.success(message, { description });
};

export const notifyInfo = (message: string, description?: string) => {
  toast.info(message, { description });
};

export const notifyWarning = (message: string, description?: string) => {
  toast.warning(message, { description });
};

/**
 * Surface a user-friendly error toast while logging the technical detail
 * to the console. See `lib/errors.ts` for the mapping.
 */
export const notifyError = (err: unknown, context?: string, fallback?: string) => {
  const info = toFriendlyError(err, context, fallback);
  toast.error(info.message);
};

/** Show a loading toast and return its id so it can be resolved with `resolveToast`. */
export const beginLoading = (message: string): string | number => toast.loading(message);

/** Replace a loading toast with a success / error / or just dismiss it. */
export const resolveToast = (
  id: string | number,
  outcome: 'success' | 'error' | 'dismiss',
  message?: string
) => {
  if (outcome === 'dismiss') {
    toast.dismiss(id);
  } else if (outcome === 'success') {
    toast.success(message || 'Done!', { id });
  } else {
    toast.error(message || 'Something went wrong.', { id });
  }
};

/**
 * Run a promise and auto-surface a friendly error toast on failure while
 * returning a typed result. Technical errors go to the console.
 */
export const withErrorToast = async <T>(
  promise: Promise<T>,
  context: string,
  fallback?: string
): Promise<T | null> => {
  try {
    return await promise;
  } catch (err) {
    notifyError(err, context, fallback);
    return null;
  }
};

// Re-export so callers can log technical details without importing errors.ts directly.
export { logTechnicalError };