import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, ChevronDown, Check, Loader2, FileImage, Sparkles } from 'lucide-react';
import { downloadImageInFormat, SupportedImageFormat } from '../services/imageExportService';

interface ImageDownloadDropdownProps {
  imageUrl: string;
  filenameSlug?: string;
  buttonVariant?: 'primary' | 'icon' | 'compact' | 'modal' | 'outline' | 'glass';
  buttonText?: string;
  className?: string;
  onDownloadSuccess?: (format: SupportedImageFormat) => void;
  onDownloadError?: (err: any) => void;
}

const FORMAT_OPTIONS: {
  id: SupportedImageFormat;
  label: string;
  ext: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'png',
    label: 'PNG Image',
    ext: '.png',
    badge: 'Lossless',
    description: 'High fidelity with transparent background support'
  },
  {
    id: 'webp',
    label: 'WebP Image',
    ext: '.webp',
    badge: 'Web Optimized',
    description: 'Ultra lightweight compression for fast web loading'
  },
  {
    id: 'jpeg',
    label: 'JPEG Image',
    ext: '.jpg',
    badge: 'Standard',
    description: 'High compatibility photographic format'
  }
];

export const ImageDownloadDropdown: React.FC<ImageDownloadDropdownProps> = ({
  imageUrl,
  filenameSlug = 'campaign-graphic',
  buttonVariant = 'primary',
  buttonText = 'Download Image',
  className = '',
  onDownloadSuccess,
  onDownloadError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<SupportedImageFormat | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updatePosition = () => {
    if (!buttonRef.current || !menuRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = menuRef.current.offsetWidth || 256;
    const menuHeight = menuRef.current.offsetHeight || 220;

    let left = rect.right - menuWidth;
    if (left < 8) {
      left = Math.max(8, rect.left);
    }
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    let top = rect.bottom + 8;
    if (rect.bottom + menuHeight > window.innerHeight - 8 && rect.top - menuHeight > 8) {
      top = rect.top - menuHeight - 8;
    }
    // Final clamp so the menu never runs off-screen even when it grows taller than the estimate
    top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));

    setMenuPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownload = async (format: SupportedImageFormat, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!imageUrl || downloadingFormat) return;

    setDownloadingFormat(format);
    try {
      await downloadImageInFormat(imageUrl, filenameSlug, format);
      if (onDownloadSuccess) {
        onDownloadSuccess(format);
      }
    } catch (err) {
      console.error('Failed to download image:', err);
      if (onDownloadError) {
        onDownloadError(err);
      }
    } finally {
      setDownloadingFormat(null);
      setIsOpen(false);
    }
  };

  const getButtonStyles = () => {
    switch (buttonVariant) {
      case 'icon':
        return 'p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 rounded-lg transition-all border border-white/10 cursor-pointer shadow';
      case 'compact':
        return 'px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer';
      case 'modal':
        return 'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer';
      case 'glass':
        return 'bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 flex items-center gap-2 cursor-pointer';
      case 'outline':
        return 'px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700';
      case 'primary':
      default:
        return 'px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer';
    }
  };

  const menuElement = isOpen ? (
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
        className="w-64 max-h-[min(70vh,30rem)] overflow-y-auto custom-scrollbar rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-[99999] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <FileImage className="w-3.5 h-3.5 text-purple-400" />
            <span>Select Format</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Image Export</span>
        </div>

        <div className="space-y-1 pt-1">
          {FORMAT_OPTIONS.map((opt) => {
            const isLoadingThis = downloadingFormat === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={downloadingFormat !== null}
                onClick={(e) => handleDownload(opt.id, e)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/90 transition-all flex items-start justify-between group cursor-pointer border border-transparent hover:border-slate-700/50"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                      {opt.label}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                      opt.id === 'webp' 
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
                        : opt.id === 'png'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {opt.ext}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {opt.description}
                  </p>
                </div>

                {isLoadingThis && (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-2 bg-purple-950/40 border-t border-purple-500/20 rounded-xl mt-1 flex items-center gap-1.5 text-[10px] text-purple-300">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>WebP format offers up to 40% smaller size for web deployment.</span>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${getButtonStyles()} ${className}`}
        title="Download graphic in PNG, WebP or JPEG format"
      >
        {downloadingFormat ? (
          <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {buttonVariant !== 'icon' && <span>{buttonText}</span>}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuElement}
    </>
  );
};
