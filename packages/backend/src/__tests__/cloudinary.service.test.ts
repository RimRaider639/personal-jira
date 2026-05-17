import {
  uploadFile,
  deleteFile,
  generateThumbnailUrl,
  getSignedUrl,
  isCloudinaryConfigured,
  UploadOptions,
} from '../services/cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { Writable } from 'stream';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    url: jest.fn(),
  },
}));

// Mock config
jest.mock('../config', () => ({
  config: {
    cloudinary: {
      cloudName: 'test-cloud',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
    },
  },
}));

/**
 * Create a mock writable stream that properly handles piping
 */
function createMockWritableStream(callback: (error?: Error, result?: unknown) => void, result?: unknown, error?: Error): Writable {
  const writable = new Writable({
    write(_chunk, _encoding, cb) {
      cb();
    },
    final(cb) {
      if (error) {
        callback(error as unknown as Error);
      } else {
        callback(undefined, result);
      }
      cb();
    },
  });
  return writable;
}

describe('Cloudinary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isCloudinaryConfigured', () => {
    it('should return true when all credentials are set', () => {
      expect(isCloudinaryConfigured()).toBe(true);
    });
  });

  describe('generateThumbnailUrl', () => {
    it('should generate a thumbnail URL with default dimensions', () => {
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,h_200,q_auto,w_200/test-public-id';
      (cloudinary.url as jest.Mock).mockReturnValue(mockUrl);

      const result = generateThumbnailUrl('test-public-id');

      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        transformation: [
          {
            width: 200,
            height: 200,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            format: 'auto',
          },
        ],
        secure: true,
      });
      expect(result).toBe(mockUrl);
    });

    it('should generate a thumbnail URL with custom dimensions', () => {
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,h_100,q_auto,w_150/test-public-id';
      (cloudinary.url as jest.Mock).mockReturnValue(mockUrl);

      const result = generateThumbnailUrl('test-public-id', 150, 100);

      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        transformation: [
          {
            width: 150,
            height: 100,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            format: 'auto',
          },
        ],
        secure: true,
      });
      expect(result).toBe(mockUrl);
    });
  });

  describe('uploadFile', () => {
    it('should reject invalid MIME types', async () => {
      const buffer = Buffer.from('test content');
      const options: UploadOptions = {
        mimeType: 'application/x-invalid',
      };

      await expect(uploadFile(buffer, options)).rejects.toThrow('Invalid MIME type');
    });

    it('should accept valid image MIME types', async () => {
      const buffer = Buffer.from('test image content');
      const mockResult = {
        public_id: 'kanban-attachments/test_123',
        url: 'http://res.cloudinary.com/test/image/upload/test.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        format: 'jpg',
        bytes: 1024,
        width: 800,
        height: 600,
        resource_type: 'image',
      };

      // Mock upload_stream to return a proper writable stream
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          return createMockWritableStream(callback, mockResult);
        }
      );

      // Mock thumbnail URL generation
      (cloudinary.url as jest.Mock).mockReturnValue('https://res.cloudinary.com/test/thumbnail.jpg');

      const result = await uploadFile(buffer, { mimeType: 'image/jpeg' });

      expect(result.publicId).toBe('kanban-attachments/test_123');
      expect(result.secureUrl).toBe('https://res.cloudinary.com/test/image/upload/test.jpg');
      expect(result.format).toBe('jpg');
      expect(result.bytes).toBe(1024);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.thumbnailUrl).toBe('https://res.cloudinary.com/test/thumbnail.jpg');
    });

    it('should accept valid document MIME types', async () => {
      const buffer = Buffer.from('test document content');
      const mockResult = {
        public_id: 'kanban-attachments/doc_123',
        url: 'http://res.cloudinary.com/test/raw/upload/doc.pdf',
        secure_url: 'https://res.cloudinary.com/test/raw/upload/doc.pdf',
        format: 'pdf',
        bytes: 2048,
        resource_type: 'raw',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          return createMockWritableStream(callback, mockResult);
        }
      );

      const result = await uploadFile(buffer, { mimeType: 'application/pdf' });

      expect(result.publicId).toBe('kanban-attachments/doc_123');
      expect(result.format).toBe('pdf');
      expect(result.resourceType).toBe('raw');
      // Documents should not have thumbnailUrl
      expect(result.thumbnailUrl).toBeUndefined();
    });

    it('should handle upload errors', async () => {
      const buffer = Buffer.from('test content');
      const mockError = { message: 'Upload failed' };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          return createMockWritableStream(callback, undefined, mockError as unknown as Error);
        }
      );

      await expect(uploadFile(buffer, { mimeType: 'image/png' })).rejects.toThrow(
        'Cloudinary upload failed: Upload failed'
      );
    });

    it('should use custom folder when provided', async () => {
      const buffer = Buffer.from('test content');
      const mockResult = {
        public_id: 'custom-folder/test_123',
        url: 'http://res.cloudinary.com/test/image/upload/test.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        format: 'jpg',
        bytes: 1024,
        resource_type: 'image',
      };

      let capturedOptions: Record<string, unknown> = {};
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          capturedOptions = options;
          return createMockWritableStream(callback, mockResult);
        }
      );

      await uploadFile(buffer, { folder: 'custom-folder', mimeType: 'image/jpeg' });

      expect(capturedOptions['folder']).toBe('custom-folder');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      const result = await deleteFile('test-public-id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id', {
        resource_type: 'image',
      });
      expect(result.result).toBe('ok');
    });

    it('should return not found for non-existent files', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'not found' });

      const result = await deleteFile('non-existent-id');

      expect(result.result).toBe('not found');
    });

    it('should handle delete errors gracefully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteFile('test-public-id');

      expect(result.result).toBe('not found');
    });

    it('should use correct resource type for raw files', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await deleteFile('test-public-id', 'raw');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id', {
        resource_type: 'raw',
      });
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL', () => {
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/s--abc123--/test-public-id';
      (cloudinary.url as jest.Mock).mockReturnValue(mockUrl);

      const result = getSignedUrl('test-public-id');

      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        resource_type: 'image',
        secure: true,
        sign_url: true,
      });
      expect(result).toBe(mockUrl);
    });

    it('should generate a signed URL with expiration', () => {
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/s--abc123--/test-public-id';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      (cloudinary.url as jest.Mock).mockReturnValue(mockUrl);

      const result = getSignedUrl('test-public-id', { expiresAt });

      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        resource_type: 'image',
        secure: true,
        sign_url: true,
        expires_at: expiresAt,
      });
      expect(result).toBe(mockUrl);
    });

    it('should generate a signed URL for raw resources', () => {
      const mockUrl = 'https://res.cloudinary.com/test/raw/upload/s--abc123--/test-public-id';
      (cloudinary.url as jest.Mock).mockReturnValue(mockUrl);

      const result = getSignedUrl('test-public-id', { resourceType: 'raw' });

      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        resource_type: 'raw',
        secure: true,
        sign_url: true,
      });
      expect(result).toBe(mockUrl);
    });
  });

  describe('MIME type validation', () => {
    it('should accept all allowed MIME types', async () => {
      // This test verifies that the service correctly validates against ALLOWED_MIME_TYPES
      const invalidMimeType = 'application/x-executable';
      const buffer = Buffer.from('test');

      await expect(uploadFile(buffer, { mimeType: invalidMimeType })).rejects.toThrow(
        'Invalid MIME type'
      );
    });

    it('should list allowed MIME types in error message', async () => {
      const buffer = Buffer.from('test');

      try {
        await uploadFile(buffer, { mimeType: 'invalid/type' });
        fail('Expected error to be thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Allowed types:');
        // Verify some of the allowed types are mentioned
        expect((error as Error).message).toContain('image/jpeg');
        expect((error as Error).message).toContain('application/pdf');
      }
    });
  });
});
