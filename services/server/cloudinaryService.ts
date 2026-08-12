import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryConfig, isCloudinaryConfigured } from '@/services/server/config';

/** Configure the Cloudinary SDK once from server-side env credentials. */
cloudinary.config({
  cloud_name: getCloudinaryConfig().cloudName || undefined,
  api_key: getCloudinaryConfig().apiKey || undefined,
  api_secret: getCloudinaryConfig().apiSecret || undefined,
  secure: true
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a base64 data-URL image to Cloudinary and return the hosted secure URL.
 * Used to host generated blog section images so raw image data is never embedded in post markdown.
 */
export const uploadBase64Image = (dataUrl: string, folder = 'blog-images'): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment.'));
      return;
    }

    const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.*)$/);
    if (!mimeMatch) {
      reject(new Error('Invalid image data URL. Expected a base64 data URL.'));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed.'));
          return;
        }
        resolve({ url: result.secure_url || result.url, publicId: result.public_id });
      }
    );

    uploadStream.on('error', (err) => reject(err));
    uploadStream.end(Buffer.from(mimeMatch[2], 'base64'));
  });
};
