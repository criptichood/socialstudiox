import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Play, 
  Subtitles,
  Maximize2,
  X
} from 'lucide-react';
import { generateSrtFromScript, downloadSrtFile, downloadTranscriptFile } from '../services/subtitleService';
import { SubtitleSegment } from '../types';

interface AudioSubtitleViewerProps {
  scriptText: string;
  audioUrl?: string | null;
  durationSec?: number;
  currentTimeSec?: number;
  onSeekAudio?: (timeSec: number) => void;
  title?: string;
  className?: string;
  initiallyExpanded?: boolean;
}

export const AudioSubtitleViewer: React.FC<AudioSubtitleViewerProps> = ({
  scriptText,
  audioUrl,
  durationSec,
  currentTimeSec = 0,
  onSeekAudio,
  title = "Timed Subtitles & SRT Transcript",
  className = "",
  initiallyExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initiallyExpanded);
  const [showFullModal, setShowFullModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadedSrt, setDownloadedSrt] = useState<boolean>(false);
  const [downloadedTxt, setDownloadedTxt] = useState<boolean>(false);

  if (!scriptText || !scriptText.trim()) {
    return null;
  }

  const { srtText, segments } = generateSrtFromScript(scriptText, durationSec);
  const currentTimeMs = currentTimeSec * 1000;

  const handleCopySrt = () => {
    navigator.clipboard.writeText(srtText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSrt = () => {
    const safeTitle = title.toLowerCase().replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-') || 'subtitles';
    downloadSrtFile(`${safeTitle}.srt`, srtText);
    setDownloadedSrt(true);
    setTimeout(() => setDownloadedSrt(false), 2000);
  };

  const handleDownloadTxt = () => {
    const safeTitle = title.toLowerCase().replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-') || 'transcript';
    downloadTranscriptFile(`${safeTitle}.txt`, scriptText);
    setDownloadedTxt(true);
    setTimeout(() => setDownloadedTxt(false), 2000);
  };

  return (
    <div className={`border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 rounded-2xl overflow-hidden transition-all ${className}`}>
      
      {/* Header Bar Toggle */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Subtitles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-1.5 truncate">
              <span>{title}</span>
              <span className="px-1.5 py-0.2 bg-purple-500/10 text-purple-500 dark:text-purple-300 text-[10px] font-mono rounded font-medium shrink-0">
                {segments.length} Reel SRT lines
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullModal(true);
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-purple-400 transition-colors"
            title="Open Fullscreen Subtitle Modal"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {isExpanded ? 'Hide Subtitles' : 'View Timestamps & SRT'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Subtitle Body - Strictly bounded height with internal scrolling */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
          
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400 shrink-0" />
              <span>Click line to seek audio</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleCopySrt}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Copy SRT format subtitles to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied SRT' : 'Copy SRT'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSrt}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  downloadedSrt 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
                title="Download .srt subtitle file for video editors (CapCut, Premiere, DaVinci)"
              >
                {downloadedSrt ? <Check className="w-3 h-3 text-white" /> : <Download className="w-3 h-3 text-amber-300" />}
                <span>{downloadedSrt ? 'Downloaded SRT!' : 'Download .SRT'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  downloadedTxt 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Download raw transcript text file (.txt)"
              >
                {downloadedTxt ? <Check className="w-3 h-3 text-white" /> : <FileText className="w-3 h-3" />}
                <span>{downloadedTxt ? 'Downloaded TXT!' : 'Download .TXT'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Timed SRT Subtitles List (Bounded to max 48 (12rem) height to prevent layout overflow) */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {segments.map((seg) => {
              const isActive = currentTimeMs >= seg.startMs && currentTimeMs <= seg.endMs;

              return (
                <div
                  key={seg.id}
                  onClick={() => onSeekAudio && onSeekAudio(seg.startMs / 1000)}
                  className={`p-2 rounded-xl border text-left transition-all flex items-start justify-between gap-2 cursor-pointer group ${
                    isActive
                      ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/30 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-[9px]">
                      <span className={`font-bold px-1 py-0.1 rounded ${
                        isActive ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-purple-400'
                      }`}>
                        #{seg.id}
                      </span>
                      <span className={`font-semibold ${isActive ? 'text-amber-300' : 'text-slate-400'}`}>
                        {seg.startTime} ➔ {seg.endTime}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                          ● Playing
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                      {seg.text}
                    </p>
                  </div>

                  {onSeekAudio && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-purple-400 hover:text-purple-300 shrink-0">
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Raw SRT Preview Codebox Toggle */}
          <details className="text-[10px] text-slate-400 font-mono">
            <summary className="cursor-pointer hover:text-purple-400 transition-colors py-1 select-none font-bold uppercase tracking-wider">
              Show Raw .SRT Output
            </summary>
            <pre className="mt-1.5 p-2.5 bg-slate-950 text-purple-300 font-mono text-[10px] rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap max-h-32 custom-scrollbar">
              {srtText}
            </pre>
          </details>

        </div>
      )}

      {/* FULLSCREEN / ACCESSIBLE PORTAL MODAL DIALOG (Always centered, never overflows screen height) */}
      {showFullModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header (Sticky Top) */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/90">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                  <Subtitles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white font-display truncate">
                    {title} — Timed Subtitles & SRT
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {segments.length} short-form Reel/Shorts timed subtitle blocks
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar (Sticky) */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySrt}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SRT' : 'Copy SRT'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSrt}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    downloadedSrt 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
                  }`}
                >
                  {downloadedSrt ? <Check className="w-3.5 h-3.5 text-white" /> : <Download className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{downloadedSrt ? 'Downloaded SRT!' : 'Download .SRT Subtitles'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  downloadedTxt 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {downloadedTxt ? <Check className="w-3.5 h-3.5 text-white" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{downloadedTxt ? 'Downloaded TXT!' : 'Download .TXT Transcript'}</span>
              </button>
            </div>

            {/* Modal Scrollable Content (Bounded to remaining height) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
              <div className="space-y-2">
                {segments.map((seg) => {
                  const isActive = currentTimeMs >= seg.startMs && currentTimeMs <= seg.endMs;

                  return (
                    <div
                      key={seg.id}
                      onClick={() => {
                        if (onSeekAudio) onSeekAudio(seg.startMs / 1000);
                      }}
                      className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/25 border-purple-500/60 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-200'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="font-bold px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                            Block #{seg.id}
                          </span>
                          <span className="text-amber-300 font-bold">
                            {seg.startTime} ➔ {seg.endTime}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">
                          {seg.text}
                        </p>
                      </div>

                      {onSeekAudio && (
                        <button
                          type="button"
                          className="p-1.5 text-purple-400 hover:text-white rounded-lg transition-colors shrink-0"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Raw SRT text box */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">
                  Full Raw .SRT Subtitle File
                </span>
                <pre className="p-4 bg-slate-950 text-purple-300 font-mono text-xs rounded-2xl border border-slate-800 overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar">
                  {srtText}
                </pre>
              </div>
            </div>

            {/* Modal Footer (Sticky Bottom) */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Compatible with CapCut, Adobe Premiere, DaVinci Resolve & Final Cut Pro
              </span>
              <button
                type="button"
                onClick={() => setShowFullModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Subtitles
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
