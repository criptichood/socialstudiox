import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { VideoModelInfo } from '@/types';

interface VideoModelBehaviorProps {
  spec: VideoModelInfo;
  gatewayConfigured: boolean;
  audioLocked: boolean;
}

/**
 * Capability info panel for the currently selected video model.
 * Reads everything from the shared model catalog / server registry.
 */
export const VideoModelBehavior: React.FC<VideoModelBehaviorProps> = ({ spec, gatewayConfigured, audioLocked }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-3" id="model-info-panel">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-left"
        id="btn-model-info-toggle"
      >
        <span className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Model Behavior</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-400 leading-relaxed">{spec.description}</p>

          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
              spec.backend === 'gateway'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
            }`}>
              {spec.backend === 'gateway' ? 'Vercel AI Gateway' : 'Google Gemini'}
            </span>
            {spec.capabilities.map(cap => (
              <span key={cap} className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/50 text-[9px] font-bold font-mono uppercase">
                {cap}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/50 text-[9px] font-bold font-mono uppercase">
              {spec.imageInput === 'none' ? 'No image input' : spec.imageInput === 'multiple' ? 'Multi-image' : 'Single image'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/50 text-[9px] font-bold font-mono uppercase">
              {audioLocked ? 'Audio always on' : spec.audio ? 'Native audio' : 'No audio'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="space-y-0.5">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Resolutions</span>
              <span className="text-slate-300 font-mono">{spec.resolutions.join(' / ')}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Durations</span>
              <span className="text-slate-300 font-mono">{spec.durations.map(d => `${d}s`).join(' / ')}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Aspect Ratios</span>
              <span className="text-slate-300 font-mono">{spec.aspectRatios.join(' / ')}</span>
            </div>
          </div>

          {spec.backend === 'gateway' && !gatewayConfigured && (
            <div className="p-2.5 bg-amber-950/30 border border-amber-500/20 rounded-lg text-amber-200 text-[10px] leading-relaxed">
              Gateway not configured — add <code className="font-mono text-amber-300">AI_GATEWAY_API_KEY</code> to your <code className="font-mono text-amber-300">.env.local</code> to enable this model.
            </div>
          )}

          {spec.note && (
            <p className="text-[9px] text-slate-500 leading-relaxed">{spec.note}</p>
          )}
        </div>
      )}
    </div>
  );
};
