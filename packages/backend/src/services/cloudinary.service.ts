import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '../config';
import { ALLOWED_MIME_TYPES, isValidMimeType } from '@kanban/shared';

/**
 * Configure Cloudinary with credentials from config
 */
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Upload options for Cloudinary
 */
export interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'raw' | 'auto';
  filename?: string;
  mimeType?: string;
}

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  resourceType: string;
}

/**
 * Result of a file deletion
 */
export interface DeleteResult {
  result: 'ok' | 'not found';
}

/**
 * Image MIME types that support thumbnail generation
 */
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Default thumbnail dimensions
 */
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

/**
 * Default folder for uploads
 */
const DEFAULT_FOLDER = 'kanban-attachments';

/**
 * Check if a MIME type is an image type
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type is an image type
 */
function isImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.includes(mimeType);
}

/**
 * Get the Cloudinary resource type based on MIME type
 * @param mimeType - The MIME type of the file
 * @returns The Cloudinary resource type
 */
function getResourceType(mimeType: string): 'image' | 'raw' {
  return isImageMimeType(mimeType) ? 'image' : 'raw';
}

/**
 * Generate a thumbnail URL for an image
 * @param publicId - The Cloudinary public ID of the image
 * @param width - Thumbnail width (default: 200)
 * @param height - Thumbnail height (default: 200)
 * @returns The thumbnail URL
 */
export function generateThumbnailUrl(
  publicId: string,
  width: number = THUMBNAIL_WIDTH,
  height: number = THUMBNAIL_HEIGHT
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        format: 'auto',
      },
    ],
    secure: true,
  });
}

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - The file buffer to upload
 * @param options - Upload options including folder, resourceType, filename, and mimeType
 * @returns Promise resolving to the upload result
 * @throws Error if the MIME type is not allowed or upload fails
 */
export async function uploadFile(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = DEFAULT_FOLDER, filename, mimeType } = options;

  // Validate MIME type if provided
  if (mimeType && !isValidMimeType(mimeType)) {
    throw new Error(
      `Invalid MIME type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  // Determine resource type based on MIME type
  const resourceType = mimeType ? getResourceType(mimeType) : options.resourceType || 'auto';

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: resourceType,
      // Enable automatic format and quality optimization for images
      ...(resourceType === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    };

    // Add public_id if filename is provided (without extension)
    if (filename) {
      // Remove file extension for public_id
      const publicIdName = filename.replace(/\.[^/.]+$/, '');
      // Add timestamp to ensure uniqueness
      uploadOptions['public_id'] = `${publicIdName}_${Date.now()}`;
    }

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload failed: No result returned'));
          return;
        }

        // Build the upload result
        const uploadResult: UploadResult = {
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          format: result.format,
          bytes: result.bytes,
          resourceType: result.resource_type,
        };

        // Add dimensions for images
        if (result.width && result.height) {
          uploadResult.width = result.width;
          uploadResult.height = result.height;
        }

        // Generate thumbnail URL for images
        if (mimeType && isImageMimeType(mimeType)) {
          uploadResult.thumbnailUrl = generateThumbnailUrl(result.public_id);
        }

        resolve(uploadResult);
      }
    );

    // Convert buffer to readable stream and pipe to upload stream
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Delete a file from Cloudinary by its public ID
 * @param publicId - The Cloudinary public ID of the file to delete
 * @param resourceType - The resource type ('image' or 'raw'), defaults to 'image'
 * @returns Promise resolving to the delete result
 */
export async function deleteFile(
  publicId: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<DeleteResult> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return {
      result: result.result === 'ok' ? 'ok' : 'not found',
    };
  } catch {
    // If the file doesn't exist, Cloudinary may throw an error
    // We treat this as "not found" rather than an error
    return {
      result: 'not found',
    };
  }
}

/**
 * Get a signed URL for a file (useful for private files)
 * @param publicId - The Cloudinary public ID of the file
 * @param options - Transform options
 * @returns The signed URL
 */
export function getSignedUrl(
  publicId: string,
  options: {
    resourceType?: 'image' | 'raw';
    expiresAt?: number;
  } = {}
): string {
  const { resourceType = 'image', expiresAt } = options;

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    sign_url: true,
    ...(expiresAt && { expires_at: expiresAt }),
  });
}

/**
 * Check if Cloudinary is properly configured
 * @returns true if all required Cloudinary credentials are set
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  );
}

export default {
  uploadFile,
  deleteFile,
  generateThumbnailUrl,
  getSignedUrl,
  isCloudinaryConfigured,
};
