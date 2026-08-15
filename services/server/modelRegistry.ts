import { VIDEO_MODEL_CATALOG, VideoModelInfo } from "@/types";

/**
 * Server-side video model registry. The capability metadata lives in the shared
 * `VIDEO_MODEL_CATALOG` (types.ts); this module only adds server-only helpers
 * and is the single place routes query model specs from.
 */

export const getVideoModelSpec = (id?: string): VideoModelInfo | undefined =>
  id ? VIDEO_MODEL_CATALOG.find(model => model.id === id) : undefined;

export const videoModelCatalog = (): VideoModelInfo[] => VIDEO_MODEL_CATALOG;
