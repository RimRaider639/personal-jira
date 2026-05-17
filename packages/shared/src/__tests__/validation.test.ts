import {
  isValidPriority,
  isValidStoryPoints,
  isValidEndDate,
  isValidMimeType,
  ALLOWED_MIME_TYPES,
  MAX_STORY_POINTS,
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidPriority', () => {
    it('should return true for valid priority values', () => {
      expect(isValidPriority('low')).toBe(true);
      expect(isValidPriority('medium')).toBe(true);
      expect(isValidPriority('high')).toBe(true);
      expect(isValidPriority('critical')).toBe(true);
    });

    it('should return true for null', () => {
      expect(isValidPriority(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isValidPriority(undefined)).toBe(true);
    });

    it('should return false for invalid string values', () => {
      expect(isValidPriority('invalid')).toBe(false);
      expect(isValidPriority('LOW')).toBe(false);
      expect(isValidPriority('MEDIUM')).toBe(false);
      expect(isValidPriority('')).toBe(false);
      expect(isValidPriority('urgent')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidPriority(123)).toBe(false);
      expect(isValidPriority({})).toBe(false);
      expect(isValidPriority([])).toBe(false);
      expect(isValidPriority(true)).toBe(false);
    });
  });

  describe('isValidStoryPoints', () => {
    it('should return true for positive integers within range', () => {
      expect(isValidStoryPoints(1)).toBe(true);
      expect(isValidStoryPoints(5)).toBe(true);
      expect(isValidStoryPoints(13)).toBe(true);
      expect(isValidStoryPoints(50)).toBe(true);
      expect(isValidStoryPoints(100)).toBe(true);
    });

    it('should return true for null', () => {
      expect(isValidStoryPoints(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isValidStoryPoints(undefined)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isValidStoryPoints(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isValidStoryPoints(-1)).toBe(false);
      expect(isValidStoryPoints(-100)).toBe(false);
    });

    it('should return false for values exceeding maximum', () => {
      expect(isValidStoryPoints(101)).toBe(false);
      expect(isValidStoryPoints(200)).toBe(false);
      expect(isValidStoryPoints(1000)).toBe(false);
    });

    it('should return false for non-integer numbers', () => {
      expect(isValidStoryPoints(1.5)).toBe(false);
      expect(isValidStoryPoints(3.14)).toBe(false);
      expect(isValidStoryPoints(0.5)).toBe(false);
    });

    it('should return false for non-number values', () => {
      expect(isValidStoryPoints('5')).toBe(false);
      expect(isValidStoryPoints({})).toBe(false);
      expect(isValidStoryPoints([])).toBe(false);
      expect(isValidStoryPoints(true)).toBe(false);
    });
  });

  describe('MAX_STORY_POINTS constant', () => {
    it('should be 100', () => {
      expect(MAX_STORY_POINTS).toBe(100);
    });
  });

  describe('isValidEndDate', () => {
    it('should return true for null', () => {
      expect(isValidEndDate(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isValidEndDate(undefined)).toBe(true);
    });

    it('should return true for today', () => {
      const today = new Date();
      expect(isValidEndDate(today)).toBe(true);
    });

    it('should return true for future dates', () => {
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

    it('should return false for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isValidEndDate(yesterday)).toBe(false);

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      expect(isValidEndDate(lastWeek)).toBe(false);
    });

    it('should accept ISO string dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isValidEndDate(tomorrow.toISOString())).toBe(true);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isValidEndDate(yesterday.toISOString())).toBe(false);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidEndDate('not-a-date')).toBe(false);
      expect(isValidEndDate('2024-13-45')).toBe(false);
    });

    it('should return false for non-date values', () => {
      expect(isValidEndDate(123)).toBe(false);
      expect(isValidEndDate({})).toBe(false);
      expect(isValidEndDate([])).toBe(false);
      expect(isValidEndDate(true)).toBe(false);
    });
  });

  describe('isValidMimeType', () => {
    describe('image types', () => {
      it('should return true for JPEG', () => {
        expect(isValidMimeType('image/jpeg')).toBe(true);
      });

      it('should return true for PNG', () => {
        expect(isValidMimeType('image/png')).toBe(true);
      });

      it('should return true for GIF', () => {
        expect(isValidMimeType('image/gif')).toBe(true);
      });

      it('should return true for WebP', () => {
        expect(isValidMimeType('image/webp')).toBe(true);
      });
    });

    describe('document types', () => {
      it('should return true for PDF', () => {
        expect(isValidMimeType('application/pdf')).toBe(true);
      });

      it('should return true for plain text', () => {
        expect(isValidMimeType('text/plain')).toBe(true);
      });
    });

    describe('Microsoft Office formats', () => {
      it('should return true for .doc', () => {
        expect(isValidMimeType('application/msword')).toBe(true);
      });

      it('should return true for .docx', () => {
        expect(isValidMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      });

      it('should return true for .xls', () => {
        expect(isValidMimeType('application/vnd.ms-excel')).toBe(true);
      });

      it('should return true for .xlsx', () => {
        expect(isValidMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
      });

      it('should return true for .ppt', () => {
        expect(isValidMimeType('application/vnd.ms-powerpoint')).toBe(true);
      });

      it('should return true for .pptx', () => {
        expect(isValidMimeType('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe(true);
      });
    });

    describe('OpenDocument formats', () => {
      it('should return true for .odt', () => {
        expect(isValidMimeType('application/vnd.oasis.opendocument.text')).toBe(true);
      });

      it('should return true for .ods', () => {
        expect(isValidMimeType('application/vnd.oasis.opendocument.spreadsheet')).toBe(true);
      });

      it('should return true for .odp', () => {
        expect(isValidMimeType('application/vnd.oasis.opendocument.presentation')).toBe(true);
      });
    });

    describe('invalid types', () => {
      it('should return false for unsupported image types', () => {
        expect(isValidMimeType('image/bmp')).toBe(false);
        expect(isValidMimeType('image/tiff')).toBe(false);
        expect(isValidMimeType('image/svg+xml')).toBe(false);
      });

      it('should return false for executable types', () => {
        expect(isValidMimeType('application/x-executable')).toBe(false);
        expect(isValidMimeType('application/x-msdownload')).toBe(false);
      });

      it('should return false for archive types', () => {
        expect(isValidMimeType('application/zip')).toBe(false);
        expect(isValidMimeType('application/x-rar-compressed')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isValidMimeType(null)).toBe(false);
        expect(isValidMimeType(undefined)).toBe(false);
        expect(isValidMimeType(123)).toBe(false);
        expect(isValidMimeType({})).toBe(false);
        expect(isValidMimeType([])).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(isValidMimeType('')).toBe(false);
      });
    });
  });

  describe('ALLOWED_MIME_TYPES constant', () => {
    it('should contain all expected image types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
      expect(ALLOWED_MIME_TYPES).toContain('image/png');
      expect(ALLOWED_MIME_TYPES).toContain('image/gif');
      expect(ALLOWED_MIME_TYPES).toContain('image/webp');
    });

    it('should contain PDF and text types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
      expect(ALLOWED_MIME_TYPES).toContain('text/plain');
    });

    it('should contain Microsoft Office types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/msword');
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-excel');
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-powerpoint');
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });

    it('should contain OpenDocument types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.oasis.opendocument.text');
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.oasis.opendocument.spreadsheet');
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.oasis.opendocument.presentation');
    });

    it('should be a readonly array', () => {
      // TypeScript ensures this at compile time, but we can verify the array exists
      expect(Array.isArray(ALLOWED_MIME_TYPES)).toBe(true);
      expect(ALLOWED_MIME_TYPES.length).toBeGreaterThan(0);
    });
  });
});
