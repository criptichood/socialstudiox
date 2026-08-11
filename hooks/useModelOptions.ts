"use client";

import { useEffect, useState } from 'react';
import { ModelBackend, ModelCatalogResponse } from '@/types';
import { fetchModelCatalog, getEnabledModelIds, ModelSettingsKey } from '@/services/ai/modelService';

export interface ModelOption {
  id: string;
  label: string;
  provider?: string;
  description?: string;
  backend: ModelBackend;
  /** Model accepts image inputs for analysis (multimodal vision). */
  vision?: boolean;
}

interface UseModelOptionsResult {
  options: ModelOption[];
  loading: boolean;
  catalog: ModelCatalogResponse | null;
}

/**
 * Curated model options for a feature dropdown. Merges the server catalog with the
 * user's saved enabled-model list for the modality (falling back to the default list).
 * Pass `includeCurrent` to guarantee the currently-selected value stays selectable.
 */
export const useModelOptions = (
  modality: ModelSettingsKey,
  includeCurrent?: string
): UseModelOptionsResult => {
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<ModelCatalogResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cat = await fetchModelCatalog();
        if (!mounted) return;
        const enabled = getEnabledModelIds(modality);
        const list = (cat[modality] || []).filter((e) => enabled.includes(e.id));
        if (includeCurrent && !list.some((e) => e.id === includeCurrent)) {
          const current = (cat[modality] || []).find((e) => e.id === includeCurrent);
          if (current) list.unshift(current);
        }
        setCatalog(cat);
        setOptions(list.map((e) => ({
          id: e.id,
          label: e.label,
          provider: e.provider,
          description: e.description,
          backend: e.backend,
          vision: e.vision,
        })));
      } catch {
        // leave options empty; dropdowns fall back to a Gemini entry
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [modality, includeCurrent]);

  return { options, loading, catalog };
};
