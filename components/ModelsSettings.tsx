"use client";

import React from 'react';
import {
  ModelCatalogResponse,
  ModelEntry,
  ModelModality,
} from '@/types';
import {
  fetchModelCatalog,
  verifyModel,
  refreshGatewayModels,
  loadModelSettings,
  saveModelSettings,
  getEnabledModelIds,
  saveEnabledModelIds,
  ModelSettings,
  ModelSettingsKey,
} from '@/services/ai/modelService';
import {
  ChevronLeft,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Cpu,
  Type,
  Image as ImageIcon,
  Wand2,
  Mic,
  Film,
  Sparkles,
} from 'lucide-react';

interface ModelsSettingsProps {
  onBackToDashboard: () => void;
}

const MODALITIES: { key: ModelSettingsKey; label: string; description: string; icon: React.ReactNode }[] = [
  { key: 'text', label: 'Text & Blog Generation', description: 'Blog posts, long-form content', icon: <Type className="w-4 h-4" /> },
  { key: 'image', label: 'Image Generation', description: 'Infographics & visual assets', icon: <ImageIcon className="w-4 h-4" /> },
  { key: 'imageEdit', label: 'Image Edit / Fix', description: 'In-place edits & corrections', icon: <Wand2 className="w-4 h-4" /> },
  { key: 'voice', label: 'Voiceover Synthesis', description: 'TTS voiceovers & narration', icon: <Mic className="w-4 h-4" /> },
  { key: 'video', label: 'Video Generation', description: 'Clips & motion graphics', icon: <Film className="w-4 h-4" /> },
];

type CatalogListKey = 'text' | 'image' | 'imageEdit' | 'voice' | 'video';

const CATALOG_KEYS: Record<ModelSettingsKey, CatalogListKey> = {
  text: 'text',
  image: 'image',
  imageEdit: 'imageEdit',
  voice: 'voice',
  video: 'video',
};

const modalityForVerify: Record<ModelSettingsKey, ModelModality> = {
  text: 'text',
  image: 'image',
  imageEdit: 'image-edit',
  voice: 'voice',
  video: 'video',
};

export const ModelsSettings: React.FC<ModelsSettingsProps> = ({ onBackToDashboard }) => {
  const [catalog, setCatalog] = React.useState<ModelCatalogResponse | null>(null);
  const [settings, setSettings] = React.useState<ModelSettings | null>(null);
  const [enabled, setEnabled] = React.useState<Record<ModelSettingsKey, string[]> | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<ModelSettingsKey>('text');

  const [testing, setTesting] = React.useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = React.useState<Record<string, { ok: boolean; latencyMs?: number; error?: string }>>({});

  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshResult, setRefreshResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchModelCatalog()
      .then((cat) => {
        if (!mounted) return;
        const saved = loadModelSettings();
        setCatalog(cat);
        setSettings({
          text: saved.text || cat.defaults.text,
          image: saved.image || cat.defaults.image,
          imageEdit: saved.imageEdit || cat.defaults.imageEdit,
          voice: saved.voice || cat.defaults.voice,
          video: saved.video || cat.defaults.video,
          enabled: {
            text: getEnabledModelIds('text'),
            image: getEnabledModelIds('image'),
            imageEdit: getEnabledModelIds('imageEdit'),
            voice: getEnabledModelIds('voice'),
            video: getEnabledModelIds('video'),
          },
        });
        setEnabled({
          text: getEnabledModelIds('text'),
          image: getEnabledModelIds('image'),
          imageEdit: getEnabledModelIds('imageEdit'),
          voice: getEnabledModelIds('voice'),
          video: getEnabledModelIds('video'),
        });
      })
      .catch((err: any) => {
        if (mounted) setLoadError(err?.message || 'Failed to load the model catalog.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const updateSetting = (key: ModelSettingsKey, value: string) => {
    if (!settings) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveModelSettings(next);
  };

  const toggleEnabled = (key: ModelSettingsKey, id: string) => {
    if (!enabled) return;
    const current = enabled[key] || [];
    const next = current.includes(id)
      ? current.filter((m) => m !== id)
      : [...current, id];
    setEnabled(prev => ({ ...prev!, [key]: next }));
    saveEnabledModelIds(key, next);
  };

  const handleVerify = async (entry: ModelEntry, key: ModelSettingsKey) => {
    setTesting(prev => ({ ...prev, [entry.id]: true }));
    setTestResults(prev => ({ ...prev, [entry.id]: { ok: false } }));
    try {
      const result = await verifyModel(modalityForVerify[key], entry.backend, entry.id);
      setTestResults(prev => ({ ...prev, [entry.id]: { ok: true, latencyMs: result.latencyMs } }));
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [entry.id]: { ok: false, error: err?.message || 'Verification failed.' } }));
    } finally {
      setTesting(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const ids = await refreshGatewayModels();
      setRefreshResult({
        ok: true,
        message: `Gateway reported ${ids.length} available model id${ids.length === 1 ? '' : 's'}. Curated catalogs still drive the app; add ids here for verification.`,
      });
    } catch (err: any) {
      setRefreshResult({ ok: false, message: err?.message || 'Gateway refresh failed.' });
    } finally {
      setRefreshing(false);
    }
  };

  const gatewayConfigured = Boolean(catalog?.gatewayConfigured);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit border border-slate-700 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 text-purple-400" />
          <span>Back to Projects Space</span>
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Cpu className="w-4 h-4" />
          <span>MODEL MANAGEMENT</span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-500" />
          Model Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Choose which AI model powers each feature. Gemini models run natively; AI Gateway models are routed through the Vercel AI Gateway (requires <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-mono">AI_GATEWAY_API_KEY</code>).
        </p>
      </div>

      {/* Gateway connection status */}
      <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${gatewayConfigured ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/5' : 'border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5'}`}>
        <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${gatewayConfigured ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
          {gatewayConfigured ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Vercel AI Gateway {gatewayConfigured ? 'Connected' : 'Not Configured'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {gatewayConfigured
              ? `Gateway models are enabled via ${catalog?.gatewayBaseURL || 'the hosted endpoint'}. Test individual models below.`
              : 'Add AI_GATEWAY_API_KEY (and optionally AI_GATEWAY_BASE_URL) to .env.local, then restart the dev server to enable gateway models.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing || !gatewayConfigured}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 transition-all"
          >
            {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {refreshing ? 'Fetching...' : 'Refresh'}
          </button>
          <a
            href="https://vercel.com/ai-gateway/models"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
          >
            Gateway model list <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      {refreshResult && (
        <p className={`text-[11px] leading-relaxed -mt-2 ${refreshResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {refreshResult.message}
        </p>
      )}

      {loadError && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          {loadError}
        </div>
      )}

      {/* Model configuration: tabbed per modality */}
      {settings && catalog && enabled && (
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex flex-wrap items-center gap-2">
            {MODALITIES.map(({ key, label, icon }) => {
              const isActive = activeTab === key;
              const count = (enabled[key as ModelSettingsKey] || []).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          {MODALITIES.filter(({ key }) => key === activeTab).map(({ key, label, description, icon }) => {
            const options = catalog[CATALOG_KEYS[key]] || [];
            const curated = enabled[key as ModelSettingsKey] || [];
            const curatedOptions = options.filter((o) => curated.includes(o.id));
            const selectOptions = curatedOptions.length > 0
              ? curatedOptions
              : options.filter((o) => o.id === settings[key]);
            const entries = options;
            return (
              <div key={key} className="space-y-4">
                {/* Default model selector + live preview */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{label} — Default Model</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
                    </div>
                  </div>
                  <select
                    value={settings[key]}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {selectOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} {opt.backend === 'gateway' ? '(Gateway)' : ''} {opt.vision ? '(Vision)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                    {settings[key]}
                  </p>

                  {/* Live preview of the feature dropdown */}
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/40 p-2.5 space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Live: Feature dropdown shows {selectOptions.length} model{selectOptions.length === 1 ? '' : 's'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectOptions.length === 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          No models enabled — feature falls back to its default.
                        </span>
                      )}
                      {selectOptions.map((o) => (
                        <span
                          key={o.id}
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono border ${
                            settings[key] === o.id
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {o.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Available models for this modality */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                      Available {label} Models
                    </p>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                      {curated.length} / {entries.length} enabled
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {entries.map((entry) => {
                      const isTesting = Boolean(testing[entry.id]);
                      const result = testResults[entry.id];
                      const isDefault = settings?.[key] === entry.id;
                      const isEnabled = curated.includes(entry.id);
                      return (
                        <div key={entry.id} className="py-2.5 flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={() => toggleEnabled(key, entry.id)}
                            title={isEnabled ? 'Disable from this feature dropdown' : 'Enable in this feature dropdown'}
                            className={`relative shrink-0 inline-flex items-center h-4 w-7 rounded-full transition-colors cursor-pointer ${
                              isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${
                                isEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[13px] font-semibold ${isEnabled ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 line-through'}`}>{entry.label}</span>
                              {entry.backend === 'gateway' ? (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[9px] font-bold uppercase tracking-wider">Gateway</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 text-[9px] font-bold uppercase tracking-wider">Gemini</span>
                              )}
                              {entry.vision && (
                                <span className="px-1.5 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 text-[9px] font-bold uppercase tracking-wider">Vision</span>
                              )}
                              {isDefault && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider">Default</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">{entry.id}</p>
                            {entry.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{entry.description}</p>
                            )}
                          </div>
                          {key !== 'video' && (
                            <div className="flex items-center gap-2 shrink-0">
                              {result?.ok && !isTesting && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" />OK{result.latencyMs ? ` ${result.latencyMs}ms` : ''}
                                </span>
                              )}
                              {result && !result.ok && !isTesting && result.error && (
                                <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 max-w-[140px] truncate" title={result.error}>Failed</span>
                              )}
                              <button
                                onClick={() => handleVerify(entry, key)}
                                disabled={isTesting}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 border border-slate-200 dark:border-white/10"
                              >
                                {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
                                Test
                              </button>
                            </div>
                          )}
                          {key === 'video' && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">Test in Video Studio</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!catalog && !loadError && (
        <div className="min-h-[200px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ModelsSettings;
