import { DBService } from './dbService';

export type SupportedImageFormat = 'png' | 'webp' | 'jpeg';

export interface DownloadImageOptions {
  format?: SupportedImageFormat;
  quality?: number; // 0.1 to 1.0, default 0.92 for webp/jpeg
  filenameSlug?: string;
}

/**
 * Downloads an image (data URL, blob URL, standard HTTP URL, or db-img: ID)
 * converted to the specified format (png, webp, jpeg).
 */
export const downloadImageInFormat = async (
  rawUrlOrDbRef: string,
  filenameSlug: string = 'infographic-asset',
  format: SupportedImageFormat = 'png',
  quality: number = 0.92
): Promise<void> => {
  if (!rawUrlOrDbRef) {
    throw new Error('Image source URL or DB reference is empty');
  }

  let dataUrl = rawUrlOrDbRef;

  // Resolve IndexedDB image reference if needed
  if (rawUrlOrDbRef.startsWith('db-img:')) {
    const imageId = rawUrlOrDbRef.substring(7);
    const dbRecord = await DBService.get(imageId);
    if (dbRecord && dbRecord.data) {
      dataUrl = dbRecord.data;
    } else {
      throw new Error('Could not resolve image from database storage');
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // Fill solid white background for JPEG since JPEG does not support transparency
        if (format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const mimeType = format === 'webp' ? 'image/webp' : format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const extension = format === 'jpeg' ? 'jpg' : format;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to encode image to blob'));
              return;
            }

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;

            // Sanitize filename slug
            const safeSlug = filenameSlug
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9_-]+/g, '-')
              .replace(/\.[^/.]+$/, '') // Strip extension if present
              .substring(0, 60) || 'image-export';

            a.download = `${safeSlug}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            resolve();
          },
          mimeType,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for format conversion'));
    };

    img.src = dataUrl;
  });
};
