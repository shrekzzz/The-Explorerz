import cloudinary from '../config/cloudinary.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

// ─── Types ──────────────────────────────

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// ─── Upload Constants ───────────────────

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Upload Functions ───────────────────

/**
 * Upload an image buffer to Cloudinary with automatic optimization.
 */
export async function uploadImage(
  fileBuffer: Buffer,
  originalName: string,
  folder: string = 'explorerz'
): Promise<UploadResult> {
  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new BadRequestError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ALLOWED_FORMATS,
          transformation: [
            { quality: 'auto:good', fetch_format: 'auto' },
            { width: 2000, crop: 'limit' }, // Max width 2000px
          ],
          // Strip EXIF data for privacy
          eager: [
            { width: 400, height: 300, crop: 'fill', quality: 'auto:good' }, // Thumbnail
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    logger.info({ publicId: result.public_id, bytes: result.bytes }, 'Image uploaded to Cloudinary');

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (err: any) {
    logger.error({ err, originalName }, 'Cloudinary upload failed');
    throw new BadRequestError(err.message || 'Failed to upload image');
  }
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info({ publicId }, 'Image deleted from Cloudinary');
  } catch (err) {
    logger.error({ err, publicId }, 'Cloudinary delete failed');
  }
}

/**
 * Generate a signed upload URL for direct client-side uploads (advanced).
 */
export function generateSignedUploadParams(folder: string = 'explorerz') {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    cloudinary.config().api_secret!
  );

  return {
    timestamp,
    signature,
    folder,
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
  };
}
