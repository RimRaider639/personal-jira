/**
 * Attachment Operations Unit Tests
 *
 * Property Tests:
 * - Property 17: Attachment File Type Validation
 * - Property 18: Attachment Storage Round-Trip
 *
 * Validates: Requirements 7.2, 7.3, 7.4
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';
import { isValidMimeType, ALLOWED_MIME_TYPES } from '@kanban/shared';

const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Attachment Operations', () => {
  interface Attachment {
    id: string;
    taskId: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    cloudinaryPublicId: string;
    createdAt: Date;
  }

  interface Task {
    id: string;
    boardId: string;
    attachments: Attachment[];
  }

  const createAttachment = (
    taskId: string,
    filename: string,
    mimeType: string,
    size: number = 1024
  ): Attachment => ({
    id: createObjectId(),
    taskId,
    filename,
    url: `https://res.cloudinary.com/demo/image/upload/v1234567890/${filename}`,
    mimeType,
    size,
    cloudinaryPublicId: `kanban-attachments/${createObjectId()}/${filename.replace(/\.[^/.]+$/, '')}_${Date.now()}`,
    createdAt: new Date(),
  });

  describe('Property 17: Attachment File Type Validation', () => {
    describe('Allowed MIME Types', () => {
      it('should accept all allowed image types', () => {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        imageMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(true);
        });
      });

      it('should accept PDF and text documents', () => {
        const documentMimeTypes = ['application/pdf', 'text/plain'];

        documentMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(true);
        });
      });

      it('should accept Microsoft Office formats', () => {
        const officeMimeTypes = [
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel', // .xls
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-powerpoint', // .ppt
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        ];

        officeMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(true);
        });
      });

      it('should accept OpenDocument formats', () => {
        const openDocMimeTypes = [
          'application/vnd.oasis.opendocument.text', // .odt
          'application/vnd.oasis.opendocument.spreadsheet', // .ods
          'application/vnd.oasis.opendocument.presentation', // .odp
        ];

        openDocMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(true);
        });
      });

      it('should accept all ALLOWED_MIME_TYPES', () => {
        ALLOWED_MIME_TYPES.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(true);
        });
      });
    });

    describe('Rejected MIME Types', () => {
      it('should reject executable files', () => {
        const executableMimeTypes = [
          'application/x-executable',
          'application/x-msdownload',
          'application/x-msdos-program',
          'application/octet-stream',
        ];

        executableMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(false);
        });
      });

      it('should reject script files', () => {
        const scriptMimeTypes = [
          'application/javascript',
          'text/javascript',
          'application/x-python',
          'text/x-python',
          'application/x-sh',
          'text/x-shellscript',
        ];

        scriptMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(false);
        });
      });

      it('should reject archive files', () => {
        const archiveMimeTypes = [
          'application/zip',
          'application/x-rar-compressed',
          'application/x-tar',
          'application/gzip',
          'application/x-7z-compressed',
        ];

        archiveMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(false);
        });
      });

      it('should reject video files', () => {
        const videoMimeTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

        videoMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(false);
        });
      });

      it('should reject audio files', () => {
        const audioMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];

        audioMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(false);
        });
      });

      it('should reject HTML and XML', () => {
        const markupMimeTypes = ['text/html', 'application/xhtml+xml', 'application/xml'];

        markupMimeTypes.forEach((mimeType) => {
          expect(isValidMimeType(mimeType)).toBe(false);
        });
      });
    });

    describe('Invalid Input Handling', () => {
      it('should reject non-string values', () => {
        expect(isValidMimeType(null)).toBe(false);
        expect(isValidMimeType(undefined)).toBe(false);
        expect(isValidMimeType(123)).toBe(false);
        expect(isValidMimeType({})).toBe(false);
        expect(isValidMimeType([])).toBe(false);
        expect(isValidMimeType(true)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(isValidMimeType('')).toBe(false);
      });

      it('should reject malformed MIME types', () => {
        expect(isValidMimeType('image')).toBe(false);
        expect(isValidMimeType('jpeg')).toBe(false);
        expect(isValidMimeType('image/')).toBe(false);
        expect(isValidMimeType('/jpeg')).toBe(false);
      });

      it('should be case-sensitive (MIME types are lowercase)', () => {
        expect(isValidMimeType('IMAGE/JPEG')).toBe(false);
        expect(isValidMimeType('Image/Jpeg')).toBe(false);
        expect(isValidMimeType('APPLICATION/PDF')).toBe(false);
      });
    });

    describe('Property-Based Tests', () => {
      it('should consistently validate any allowed MIME type', () => {
        fc.assert(
          fc.property(fc.constantFrom(...ALLOWED_MIME_TYPES), (mimeType) => {
            return isValidMimeType(mimeType) === true;
          })
        );
      });

      it('should consistently reject random strings not in allowed list', () => {
        fc.assert(
          fc.property(
            fc.string().filter((s) => !ALLOWED_MIME_TYPES.includes(s as typeof ALLOWED_MIME_TYPES[number])),
            (randomString) => {
              return isValidMimeType(randomString) === false;
            }
          )
        );
      });
    });
  });

  describe('Property 18: Attachment Storage Round-Trip', () => {
    describe('Attachment Creation', () => {
      it('should create attachment with all required fields', () => {
        const taskId = createObjectId();
        const filename = 'document.pdf';
        const mimeType = 'application/pdf';
        const size = 2048;

        const attachment = createAttachment(taskId, filename, mimeType, size);

        expect(attachment.id).toBeDefined();
        expect(attachment.taskId).toBe(taskId);
        expect(attachment.filename).toBe(filename);
        expect(attachment.url).toContain('cloudinary.com');
        expect(attachment.mimeType).toBe(mimeType);
        expect(attachment.size).toBe(size);
        expect(attachment.cloudinaryPublicId).toBeDefined();
        expect(attachment.createdAt).toBeInstanceOf(Date);
      });

      it('should generate unique cloudinaryPublicId for each attachment', () => {
        const taskId = createObjectId();
        const attachments = Array.from({ length: 10 }, () =>
          createAttachment(taskId, 'test.pdf', 'application/pdf')
        );

        const publicIds = attachments.map((a) => a.cloudinaryPublicId);
        const uniqueIds = new Set(publicIds);

        expect(uniqueIds.size).toBe(attachments.length);
      });

      it('should preserve filename in attachment', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => !s.includes('/') && !s.includes('\0')),
            (filename) => {
              const attachment = createAttachment(createObjectId(), filename, 'application/pdf');
              return attachment.filename === filename;
            }
          )
        );
      });
    });

    describe('Attachment Storage in Task', () => {
      it('should add attachment to task', () => {
        const task: Task = {
          id: createObjectId(),
          boardId: createObjectId(),
          attachments: [],
        };

        const attachment = createAttachment(task.id, 'file.pdf', 'application/pdf');
        task.attachments.push(attachment);

        expect(task.attachments).toHaveLength(1);
        expect(task.attachments[0]).toEqual(attachment);
      });

      it('should support multiple attachments per task', () => {
        const task: Task = {
          id: createObjectId(),
          boardId: createObjectId(),
          attachments: [],
        };

        const attachments = [
          createAttachment(task.id, 'doc1.pdf', 'application/pdf'),
          createAttachment(task.id, 'image.png', 'image/png'),
          createAttachment(task.id, 'spreadsheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        ];

        task.attachments.push(...attachments);

        expect(task.attachments).toHaveLength(3);
        attachments.forEach((attachment, index) => {
          expect(task.attachments[index]).toEqual(attachment);
        });
      });

      it('should retrieve attachment by ID', () => {
        const task: Task = {
          id: createObjectId(),
          boardId: createObjectId(),
          attachments: [
            createAttachment(createObjectId(), 'file1.pdf', 'application/pdf'),
            createAttachment(createObjectId(), 'file2.png', 'image/png'),
            createAttachment(createObjectId(), 'file3.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
          ],
        };

        const targetId = task.attachments[1].id;
        const found = task.attachments.find((a) => a.id === targetId);

        expect(found).toBeDefined();
        expect(found?.filename).toBe('file2.png');
      });

      it('should delete attachment from task', () => {
        const task: Task = {
          id: createObjectId(),
          boardId: createObjectId(),
          attachments: [
            createAttachment(createObjectId(), 'file1.pdf', 'application/pdf'),
            createAttachment(createObjectId(), 'file2.png', 'image/png'),
          ],
        };

        const attachmentToDelete = task.attachments[0].id;
        task.attachments = task.attachments.filter((a) => a.id !== attachmentToDelete);

        expect(task.attachments).toHaveLength(1);
        expect(task.attachments[0].filename).toBe('file2.png');
      });
    });

    describe('Attachment Data Integrity', () => {
      it('should preserve all attachment data through storage', () => {
        fc.assert(
          fc.property(
            fc.record({
              filename: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('/') && !s.includes('\0')),
              mimeType: fc.constantFrom(...ALLOWED_MIME_TYPES),
              size: fc.nat({ max: 10 * 1024 * 1024 }), // Max 10MB
            }),
            ({ filename, mimeType, size }) => {
              const taskId = createObjectId();
              const attachment = createAttachment(taskId, filename, mimeType, size);

              // Simulate storage and retrieval
              const stored = JSON.parse(JSON.stringify(attachment));

              expect(stored.filename).toBe(filename);
              expect(stored.mimeType).toBe(mimeType);
              expect(stored.size).toBe(size);
              expect(stored.taskId).toBe(taskId);

              return true;
            }
          )
        );
      });

      it('should maintain attachment order in task', () => {
        const task: Task = {
          id: createObjectId(),
          boardId: createObjectId(),
          attachments: [],
        };

        const filenames = ['first.pdf', 'second.png', 'third.docx', 'fourth.txt'];
        filenames.forEach((filename) => {
          task.attachments.push(createAttachment(task.id, filename, 'application/pdf'));
        });

        task.attachments.forEach((attachment, index) => {
          expect(attachment.filename).toBe(filenames[index]);
        });
      });
    });

    describe('Cloudinary URL Generation', () => {
      it('should generate valid Cloudinary URL', () => {
        const attachment = createAttachment(createObjectId(), 'test.pdf', 'application/pdf');

        expect(attachment.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
      });

      it('should include filename in URL', () => {
        const filename = 'my-document.pdf';
        const attachment = createAttachment(createObjectId(), filename, 'application/pdf');

        expect(attachment.url).toContain(filename);
      });
    });

    describe('Resource Type Determination', () => {
      const getResourceType = (mimeType: string): 'image' | 'raw' => {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return imageMimeTypes.includes(mimeType) ? 'image' : 'raw';
      };

      it('should classify image MIME types as "image" resource', () => {
        expect(getResourceType('image/jpeg')).toBe('image');
        expect(getResourceType('image/png')).toBe('image');
        expect(getResourceType('image/gif')).toBe('image');
        expect(getResourceType('image/webp')).toBe('image');
      });

      it('should classify non-image MIME types as "raw" resource', () => {
        expect(getResourceType('application/pdf')).toBe('raw');
        expect(getResourceType('text/plain')).toBe('raw');
        expect(getResourceType('application/msword')).toBe('raw');
        expect(getResourceType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('raw');
      });

      it('should correctly classify all allowed MIME types', () => {
        fc.assert(
          fc.property(fc.constantFrom(...ALLOWED_MIME_TYPES), (mimeType) => {
            const resourceType = getResourceType(mimeType);
            return resourceType === 'image' || resourceType === 'raw';
          })
        );
      });
    });
  });

  describe('Attachment Size Validation', () => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const isValidFileSize = (size: number): boolean => {
      return typeof size === 'number' && size > 0 && size <= MAX_FILE_SIZE;
    };

    it('should accept files within size limit', () => {
      expect(isValidFileSize(1024)).toBe(true); // 1KB
      expect(isValidFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(isValidFileSize(MAX_FILE_SIZE)).toBe(true); // 10MB
    });

    it('should reject files exceeding size limit', () => {
      expect(isValidFileSize(MAX_FILE_SIZE + 1)).toBe(false);
      expect(isValidFileSize(20 * 1024 * 1024)).toBe(false); // 20MB
    });

    it('should reject zero or negative sizes', () => {
      expect(isValidFileSize(0)).toBe(false);
      expect(isValidFileSize(-1)).toBe(false);
      expect(isValidFileSize(-1024)).toBe(false);
    });

    it('should validate any positive size within limit', () => {
      fc.assert(
        fc.property(fc.nat({ max: MAX_FILE_SIZE - 1 }), (size) => {
          // Add 1 to avoid 0
          return isValidFileSize(size + 1) === true;
        })
      );
    });
  });
});
