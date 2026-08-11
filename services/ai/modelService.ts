import { ModelBackend, ModelCatalogResponse, ModelEntry, ModelModality, IMAGE_MODELS, VIDEO_MODEL_CATALOG } from "@/types";

let cachedCatalog: ModelCatalogResponse | null = null;

export const fetchModelCatalog = async (force = false): Promise<ModelCatalogResponse> => {
  if (cachedCatalog && !force) return cachedCatalog;
  const response = await fetch("/api/models", { method: "GET" });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to load model catalog");
  }

  cachedCatalog = await response.json();
  return cachedCatalog!;
};

export const clearModelCatalogCache = () => {
  cachedCatalog = null;
};

export const verifyModel = async (
  modality: ModelModality,
  backend: ModelBackend,
  model: string
): Promise<{ success?: boolean; latencyMs?: number; error?: string }> => {
  const response = await fetch("/api/models/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modality, backend, model })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Model verification failed");
  }
  return data;
};

export const refreshGatewayModels = async (): Promise<string[]> => {
  const response = await fetch("/api/models/refresh", { method: "POST" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Gateway model refresh failed");
  }
  return data.modelIds || [];
};

export interface ModelSettings {
  text: string;
  image: string;
  imageEdit: string;
  voice: string;
  video: string;
  enabled: {
    text: string[];
    image: string[];
    imageEdit: string[];
    voice: string[];
    video: string[];
  };
}

export type ModelSettingsKey = keyof ModelSettings['enabled'];

/** Default curated (enabled) model lists per modality — mirrors today's hardcoded dropdowns until the user curates. */
export const DEFAULT_ENABLED_MODELS: Record<ModelSettingsKey, string[]> = {
  text: ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'],
  image: IMAGE_MODELS.map(m => m.value),
  imageEdit: ['gemini-3.1-flash-image'],
  voice: ['gemini-3.1-flash-tts-preview', 'gemini-2.0-flash-exp'],
  video: VIDEO_MODEL_CATALOG.map(v => v.id),
};

const SETTINGS_KEY = "ssx_model_settings";

export const loadModelSettings = (): Partial<ModelSettings> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Partial<ModelSettings>) : {};
  } catch {
    return {};
  }
};

export const saveModelSettings = (settings: ModelSettings): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

/** Curated id list for a modality: saved selection, else the default (current-hardcoded) list. */
export const getEnabledModelIds = (modality: ModelSettingsKey): string[] => {
  const saved = loadModelSettings().enabled?.[modality];
  return saved && saved.length > 0 ? saved : DEFAULT_ENABLED_MODELS[modality];
};

/** Persist the curated list for a modality (merges into existing settings). */
export const saveEnabledModelIds = (modality: ModelSettingsKey, ids: string[]): void => {
  const current = loadModelSettings();
  saveModelSettings({
    text: current.text || '',
    image: current.image || '',
    imageEdit: current.imageEdit || '',
    voice: current.voice || '',
    video: current.video || '',
    enabled: { ...DEFAULT_ENABLED_MODELS, ...(current.enabled || {}), [modality]: ids },
  });
};

/** Effective model id for a modality: user setting, else the server catalog default. */
export const resolveModelId = (
  modality: ModelModality,
  catalog?: ModelCatalogResponse | null
): string => {
  const settings = loadModelSettings();
  const key: ModelSettingsKey = modality === 'image-edit' ? 'imageEdit' : (modality as ModelSettingsKey);
  const saved = settings[key];
  if (saved) return saved;
  return catalog?.defaults?.[key] || '';
};
