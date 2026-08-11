import {
  IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  GATEWAY_TEXT_MODELS,
  GATEWAY_IMAGE_MODELS,
  GATEWAY_VOICE_MODELS,
  VIDEO_MODEL_CATALOG,
  ModelBackend,
  ModelCatalogResponse,
  ModelEntry
} from "@/types";
import { TEXT_MODEL, EDIT_MODEL, isGatewayConfigured } from "@/services/server/config";

/** Gemini-native models the app ships with, surfaced alongside gateway entries. */
const GEMINI_TEXT_MODELS: ModelEntry[] = [
  { id: TEXT_MODEL, label: 'Gemini 3.5 Flash (Default)', provider: 'Google Gemini', backend: 'gemini', description: 'Default app text model.', vision: true },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', provider: 'Google Gemini', backend: 'gemini', description: 'Fast intelligent tier.', vision: true },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'Google Gemini', backend: 'gemini', description: 'High-reasoning tier.', vision: true },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', provider: 'Google Gemini', backend: 'gemini', description: 'Ultra-fast tier.', vision: true }
];

const GEMINI_IMAGE_MODELS: ModelEntry[] = IMAGE_MODELS.map(m => ({
  id: m.value,
  label: m.label,
  provider: 'Google Gemini',
  backend: 'gemini' as ModelBackend,
  description: m.description
}));

const GEMINI_VOICE_MODEL: ModelEntry = {
  id: 'gemini-3.1-flash-tts-preview',
  label: 'Gemini Flash TTS',
  provider: 'Google Gemini',
  backend: 'gemini',
  description: 'Default Gemini voiceover model.'
};

export const VOICE_DEFAULT_MODEL = 'gemini-3.1-flash-tts-preview';

export const buildModelCatalog = (): ModelCatalogResponse => {
  const gatewayConfigured = isGatewayConfigured();

  const text = [...GEMINI_TEXT_MODELS, ...GATEWAY_TEXT_MODELS];
  const image = [...GEMINI_IMAGE_MODELS, ...GATEWAY_IMAGE_MODELS];
  const imageEdit = [
    { id: EDIT_MODEL, label: 'Gemini 3.1 Flash Image (Edit)', provider: 'Google Gemini', backend: 'gemini' as ModelBackend, description: 'Default in-place edit model.' },
    ...GATEWAY_IMAGE_MODELS
  ];
  const voice = [GEMINI_VOICE_MODEL, ...GATEWAY_VOICE_MODELS];
  const video: ModelEntry[] = VIDEO_MODEL_CATALOG.map(v => ({
    id: v.id,
    label: v.label,
    provider: v.provider,
    backend: v.backend,
    description: v.description
  }));

  return {
    gatewayConfigured,
    gatewayBaseURL: gatewayConfigured ? process.env.AI_GATEWAY_BASE_URL : undefined,
    defaults: {
      text: TEXT_MODEL,
      image: DEFAULT_IMAGE_MODEL,
      imageEdit: EDIT_MODEL,
      voice: VOICE_DEFAULT_MODEL,
      video: DEFAULT_VIDEO_MODEL
    },
    text,
    image,
    imageEdit,
    voice,
    video
  };
};
