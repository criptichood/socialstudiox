import React, { useState, useEffect } from 'react';
import { DBService } from '../../services/dbService';
import { Loader2 } from 'lucide-react';

interface CampaignImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackText?: string;
}

export const CampaignImage: React.FC<CampaignImageProps> = ({ src, fallbackText, ...props }) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setResolvedSrc('');
      setIsLoading(false);
      return;
    }

    if (src.startsWith('db-img:')) {
      const imageId = src.substring(7);
      setIsLoading(true);
      setHasError(false);
      DBService.get(imageId)
        .then((img) => {
          if (img && img.data) {
            setResolvedSrc(img.data);
          } else {
            console.warn(`Image ${imageId} not found in IndexedDB`);
            setHasError(true);
          }
        })
        .catch((err) => {
          console.error('Failed to load image from DBService:', err);
          setHasError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setResolvedSrc(src);
      setIsLoading(false);
    }
  }, [src]);

  if (isLoading) {
    return (
      <div className={`bg-slate-950/80 flex flex-col items-center justify-center p-4 text-center ${props.className || 'w-full h-full'}`}>
        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
        <span className="text-[9px] font-mono text-slate-500 mt-1">Loading database graphic...</span>
      </div>
    );
  }

  if (hasError || !resolvedSrc) {
    return (
      <div className={`bg-slate-950 flex flex-col items-center justify-center p-4 text-center ${props.className || 'w-full h-full'}`}>
        <span className="text-[10px] text-slate-500 font-medium">Graphic not loaded</span>
        <span className="text-[8px] text-slate-600 font-mono mt-0.5">Reference ID missing</span>
      </div>
    );
  }

  return <img src={resolvedSrc || undefined} referrerPolicy="no-referrer" {...props} />;
};
