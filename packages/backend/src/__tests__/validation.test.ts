/**
 * Shared Validation Utilities Unit Tests
 *
 * Property Tests:
 * - Property 7: Task Data Validation (priority, story points)
 * - Property 17: Attachment File Type Validation (MIME types)
 *
 * Validates: Requirements 3.5, 3.6, 3.7, 7.2, 7.3
 */

import * as fc from 'fast-check';
import {
  isValidPriority,
  isValidStoryPoints,
  isValidEndDate,
  isValidMimeType,
  ALLOWED_MIME_TYPES,
  MAX_STORY_POINTS,
} from '@kanban/shared';

describe('Validation Utilities', () => {
  describe('Property 7: Task Data Validation', () => {
    describe('Priority Validation (isValidPriority)', () => {
      it('should accept valid priority values', () => {
        expect(isValidPriority('low')).toBe(true);
        expect(isValidPriority('medium')).toBe(true);
        expect(isValidPriority('high')).toBe(true);
        expect(isValidPriority('critical')).toBe(true);
      });

      it('should accept null and undefined', () => {
        expect(isValidPriority(null)).toBe(true);
        expect(isValidPriority(undefined)).toBe(true);
      });

      it('should reject invalid priority strings', () => {
        expect(isValidPriority('urgent')).toBe(false);
        expect(isValidPriority('normal')).toBe(false);
        expect(isValidPriority('highest')).toBe(false);
        expect(isValidPriority('lowest')).toBe(false);
        expect(isValidPriority('')).toBe(false);
      });

      it('should reject non-string values', () => {
        expect(isValidPriority(1)).toBe(false);
        expect(isValidPriority(0)).toBe(false);
        expect(isValidPriority(true)).toBe(false);
        expect(isValidPriority(false)).toBe(false);
        expect(isValidPriority({})).toBe(false);
        expect(isValidPriority([])).toBe(false);
      });

      it('should be case-sensitive', () => {
        expect(isValidPriority('Low')).toBe(false);
        expect(isValidPriority('MEDIUM')).toBe(false);
        expect(isValidPriority('High')).toBe(false);
        expect(isValidPriority('CRITICAL')).toBe(false);
      });

      it('should reject strings with whitespace', () => {
        expect(isValidPriority(' low')).toBe(false);
        expect(isValidPriority('low ')).toBe(false);
        expect(isValidPriority(' low ')).toBe(false);
      });

      it('should consistently validate valid priorities', () => {
        fc.assert(
          fc.property(fc.constantFrom('low', 'medium', 'high', 'critical'), (priority) => {
            return isValidPriority(priority) === true;
          })
        );
      });

      it('should consistently reject random invalid strings', () => {
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        fc.assert(
          fc.property(
            fc.string().filter((s) => !validPriorities.includes(s) && s !== ''),
            (invalidPriority) => {
              return isValidPriority(invalidPriority) === false;
            }
          )
        );
      });
    });

    describe('Story Points Validation (isValidStoryPoints)', () => {
      it('should accept positive integers within range', () => {
        expect(isValidStoryPoints(1)).toBe(true);
        expect(isValidStoryPoints(5)).toBe(true);
        expect(isValidStoryPoints(13)).toBe(true);
        expect(isValidStoryPoints(21)).toBe(true);
        expect(isValidStoryPoints(MAX_STORY_POINTS)).toBe(true);
      });

      it('should accept null and undefined', () => {
        expect(isValidStoryPoints(null)).toBe(true);
        expect(isValidStoryPoints(undefined)).toBe(true);
      });

      it('should reject zero', () => {
        expect(isValidStoryPoints(0)).toBe(false);
      });

      it('should reject negative numbers', () => {
        expect(isValidStoryPoints(-1)).toBe(false);
        expect(isValidStoryPoints(-5)).toBe(false);
        expect(isValidStoryPoints(-100)).toBe(false);
      });

      it('should reject numbers exceeding MAX_STORY_POINTS', () => {
        expect(isValidStoryPoints(MAX_STORY_POINTS + 1)).toBe(false);
        expect(isValidStoryPoints(200)).toBe(false);
        expect(isValidStoryPoints(1000)).toBe(false);
      });

      it('should reject non-integer numbers', () => {
        expect(isValidStoryPoints(1.5)).toBe(false);
        expect(isValidStoryPoints(3.14)).toBe(false);
        expect(isValidStoryPoints(0.5)).toBe(false);
      });

      it('should reject non-number values', () => {
        expect(isValidStoryPoints('5')).toBe(false);
        expect(isValidStoryPoints('five')).toBe(false);
        expect(isValidStoryPoints(true)).toBe(false);
        expect(isValidStoryPoints({})).toBe(false);
        expect(isValidStoryPoints([])).toBe(false);
      });

      it('should reject special number values', () => {
        expect(isValidStoryPoints(NaN)).toBe(false);
        expect(isValidStoryPoints(Infinity)).toBe(false);
        expect(isValidStoryPoints(-Infinity)).toBe(false);
      });

      it('should accept any positive integer within range', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: MAX_STORY_POINTS }), (points) => {
            return isValidStoryPoints(points) === true;
          })
        );
      });

      it('should reject any integer outside valid range', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.integer({ max: 0 }),
              fc.integer({ min: MAX_STORY_POINTS + 1 })
            ),
            (points) => {
              return isValidStoryPoints(points) === false;
            }
          )
        );
      });
    });

    describe('End Date Validation (isValidEndDate)', () => {
      it('should accept null and undefined', () => {
        expect(isValidEndDate(null)).toBe(true);
        expect(isValidEndDate(undefined)).toBe(true);
      });

      it('should accept today', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expect(isValidEndDate(today)).toBe(true);
      });

      it('should accept future dates', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(isValidEndDate(tomorrow)).toBe(true);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        expect(isValidEndDate(nextWeek)).toBe(true);

        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        expect(isValidEndDate(nextYear)).toBe(true);
      });

      it('should reject past dates', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(isValidEndDate(yesterday)).toBe(false);

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        expect(isValidEndDate(lastWeek)).toBe(false);

        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        expect(isValidEndDate(lastYear)).toBe(false);
      });

      it('should accept ISO date strings for today or future', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(isValidEndDate(tomorrow.toISOString())).toBe(true);
      });

      it('should reject ISO date strings for past dates', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(isValidEndDate(yesterday.toISOString())).toBe(false);
      });

      it('should reject invalid date strings', () => {
        expect(isValidEndDate('not-a-date')).toBe(false);
        expect(isValidEndDate('2024-13-45')).toBe(false);
        expect(isValidEndDate('')).toBe(false);
      });

      it('should reject non-date values', () => {
        expect(isValidEndDate(123)).toBe(false);
        expect(isValidEndDate(true)).toBe(false);
        expect(isValidEndDate({})).toBe(false);
        expect(isValidEndDate([])).toBe(false);
      });

      it('should accept any future date', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 365 * 10 }), (daysInFuture) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);
            return isValidEndDate(futureDate) === true;
          })
        );
      });

      it('should reject any past date', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 365 * 10 }), (daysInPast) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysInPast);
            return isValidEndDate(pastDate) === false;
          })
        );
      });
    });
  });

  describe('Property 17: Attachment File Type Validation', () => {
    describe('MIME Type Validation (isValidMimeType)', () => {
      describe('Image Types', () => {
        it('should accept JPEG', () => {
          expect(isValidMimeType('image/jpeg')).toBe(true);
        });

        it('should accept PNG', () => {
          expect(isValidMimeType('image/png')).toBe(true);
        });

        it('should accept GIF', () => {
          expect(isValidMimeType('image/gif')).toBe(true);
        });

        it('should accept WebP', () => {
          expect(isValidMimeType('image/webp')).toBe(true);
        });

        it('should reject other image formats', () => {
          expect(isValidMimeType('image/bmp')).toBe(false);
          expect(isValidMimeType('image/tiff')).toBe(false);
          expect(isValidMimeType('image/svg+xml')).toBe(false);
          expect(isValidMimeType('image/x-icon')).toBe(false);
        });
      });

      describe('Document Types', () => {
        it('should accept PDF', () => {
          expect(isValidMimeType('application/pdf')).toBe(true);
        });

        it('should accept plain text', () => {
          expect(isValidMimeType('text/plain')).toBe(true);
        });
      });

      describe('Microsoft Office Types', () => {
        it('should accept Word documents', () => {
          expect(isValidMimeType('application/msword')).toBe(true);
          expect(
            isValidMimeType(
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
          ).toBe(true);
        });

        it('should accept Excel spreadsheets', () => {
          expect(isValidMimeType('application/vnd.ms-excel')).toBe(true);
          expect(
            isValidMimeType(
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
          ).toBe(true);
        });

        it('should accept PowerPoint presentations', () => {
          expect(isValidMimeType('application/vnd.ms-powerpoint')).toBe(true);
          expect(
            isValidMimeType(
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            )
          ).toBe(true);
        });
      });

      describe('OpenDocument Types', () => {
        it('should accept OpenDocument text', () => {
          expect(isValidMimeType('application/vnd.oasis.opendocument.text')).toBe(true);
        });

        it('should accept OpenDocument spreadsheet', () => {
          expect(isValidMimeType('application/vnd.oasis.opendocument.spreadsheet')).toBe(
            true
          );
        });

        it('should accept OpenDocument presentation', () => {
          expect(
            isValidMimeType('application/vnd.oasis.opendocument.presentation')
          ).toBe(true);
        });
      });

      describe('Rejected Types', () => {
        it('should reject executable types', () => {
          expect(isValidMimeType('application/x-executable')).toBe(false);
          expect(isValidMimeType('application/x-msdownload')).toBe(false);
        });

        it('should reject script types', () => {
          expect(isValidMimeType('application/javascript')).toBe(false);
          expect(isValidMimeType('text/javascript')).toBe(false);
        });

        it('should reject archive types', () => {
          expect(isValidMimeType('application/zip')).toBe(false);
          expect(isValidMimeType('application/x-rar-compressed')).toBe(false);
        });

        it('should reject video types', () => {
          expect(isValidMimeType('video/mp4')).toBe(false);
          expect(isValidMimeType('video/mpeg')).toBe(false);
        });

        it('should reject audio types', () => {
          expect(isValidMimeType('audio/mpeg')).toBe(false);
          expect(isValidMimeType('audio/wav')).toBe(false);
        });
      });

      describe('Invalid Input', () => {
        it('should reject null and undefined', () => {
          expect(isValidMimeType(null)).toBe(false);
          expect(isValidMimeType(undefined)).toBe(false);
        });

        it('should reject non-string values', () => {
          expect(isValidMimeType(123)).toBe(false);
          expect(isValidMimeType(true)).toBe(false);
          expect(isValidMimeType({})).toBe(false);
          expect(isValidMimeType([])).toBe(false);
        });

        it('should reject empty string', () => {
          expect(isValidMimeType('')).toBe(false);
        });

        it('should be case-sensitive', () => {
          expect(isValidMimeType('IMAGE/JPEG')).toBe(false);
          expect(isValidMimeType('Application/PDF')).toBe(false);
        });
      });

      describe('Property-Based Tests', () => {
        it('should accept all allowed MIME types', () => {
          fc.assert(
            fc.property(fc.constantFrom(...ALLOWED_MIME_TYPES), (mimeType) => {
              return isValidMimeType(mimeType) === true;
            })
          );
        });

        it('should reject random strings not in allowed list', () => {
          fc.assert(
            fc.property(
              fc.string({ minLength: 1 }).filter(
                (s) => !ALLOWED_MIME_TYPES.includes(s as typeof ALLOWED_MIME_TYPES[number])
              ),
              (randomString) => {
                return isValidMimeType(randomString) === false;
              }
            )
          );
        });
      });
    });

    describe('ALLOWED_MIME_TYPES Constant', () => {
      it('should contain expected number of MIME types', () => {
        // 4 images + 2 documents + 6 MS Office + 3 OpenDocument = 15
        expect(ALLOWED_MIME_TYPES.length).toBe(15);
      });

      it('should contain all image types', () => {
        expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
        expect(ALLOWED_MIME_TYPES).toContain('image/png');
        expect(ALLOWED_MIME_TYPES).toContain('image/gif');
        expect(ALLOWED_MIME_TYPES).toContain('image/webp');
      });

      it('should contain document types', () => {
        expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
        expect(ALLOWED_MIME_TYPES).toContain('text/plain');
      });

      it('should contain MS Office types', () => {
        expect(ALLOWED_MIME_TYPES).toContain('application/msword');
        expect(ALLOWED_MIME_TYPES).toContain(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-excel');
        expect(ALLOWED_MIME_TYPES).toContain(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-powerpoint');
        expect(ALLOWED_MIME_TYPES).toContain(
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
      });

      it('should contain OpenDocument types', () => {
        expect(ALLOWED_MIME_TYPES).toContain('application/vnd.oasis.opendocument.text');
        expect(ALLOWED_MIME_TYPES).toContain(
          'application/vnd.oasis.opendocument.spreadsheet'
        );
        expect(ALLOWED_MIME_TYPES).toContain(
          'application/vnd.oasis.opendocument.presentation'
        );
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(ALLOWED_MIME_TYPES);
        expect(uniqueTypes.size).toBe(ALLOWED_MIME_TYPES.length);
      });
    });

    describe('MAX_STORY_POINTS Constant', () => {
      it('should be 100', () => {
        expect(MAX_STORY_POINTS).toBe(100);
      });

      it('should be a positive integer', () => {
        expect(Number.isInteger(MAX_STORY_POINTS)).toBe(true);
        expect(MAX_STORY_POINTS).toBeGreaterThan(0);
      });
    });
  });
});
