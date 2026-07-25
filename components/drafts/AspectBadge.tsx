import React from 'react';
import { AspectRatio } from '../../types';

interface AspectRatioIconProps {
  aspect: AspectRatio;
  className?: string;
}

export const AspectRatioIcon: React.FC<AspectRatioIconProps> = ({ aspect, className = "w-3.5 h-3.5" }) => {
  switch (aspect) {
    case '9:16':
      return (
        <span className={`inline-flex items-center justify-center ${className}`} title="9:16 Portrait / Mobile Story">
          <span className="w-2.5 h-4 border-2 border-current rounded-[3px] block flex-shrink-0" />
        </span>
      );
    case '16:9':
      return (
        <span className={`inline-flex items-center justify-center ${className}`} title="16:9 Landscape Banner / Desktop">
          <span className="w-4 h-2.5 border-2 border-current rounded-[3px] block flex-shrink-0" />
        </span>
      );
    case '1:1':
    default:
      return (
        <span className={`inline-flex items-center justify-center ${className}`} title="1:1 Square Post">
          <span className="w-3 h-3 border-2 border-current rounded-[3px] block flex-shrink-0" />
        </span>
      );
  }
};

export const getAspectLabel = (aspect: AspectRatio): string => {
  switch (aspect) {
    case '9:16':
      return '9:16 Portrait (Mobile Story / Reel)';
    case '16:9':
      return '16:9 Landscape (Banner / Desktop)';
    case '1:1':
    default:
      return '1:1 Square (Feed Post)';
  }
};

export const getAspectShortLabel = (aspect: AspectRatio): string => {
  switch (aspect) {
    case '9:16':
      return '9:16 Portrait';
    case '16:9':
      return '16:9 Landscape';
    case '1:1':
    default:
      return '1:1 Square';
  }
};
