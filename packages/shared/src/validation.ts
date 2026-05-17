import { Priority } from './index';

/**
 * Allowed MIME types for attachments
 * Supports images (JPEG, PNG, GIF, WebP), documents (PDF, TXT), and office formats
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'text/plain',
  // Microsoft Office formats
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // OpenDocument formats
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
  'application/vnd.oasis.opendocument.presentation', // .odp
] as const;

/**
 * Valid priority values
 */
const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

/**
 * Validates that a priority value is one of: low, medium, high, critical, or null
 * @param value - The value to validate
 * @returns true if the value is a valid priority or null
 */
export function isValidPriority(value: unknown): value is Priority | null {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value !== 'string') {
    return false;
  }
  return VALID_PRIORITIES.includes(value as Priority);
}

/**
 * Maximum allowed story points value
 */
export const MAX_STORY_POINTS = 100;

/**
 * Validates that story points is a positive integer between 1 and 100 (inclusive), or null
 * @param value - The value to validate
 * @returns true if the value is a positive integer in range [1, 100] or null
 */
export function isValidStoryPoints(value: unknown): value is number | null {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value !== 'number') {
    return false;
  }
  return Number.isInteger(value) && value > 0 && value <= MAX_STORY_POINTS;
}

/**
 * Validates that an end date is not in the past (for creation)
 * Compares only the date portion, ignoring time
 * @param date - The date to validate (can be Date object, ISO string, or null)
 * @returns true if the date is today or in the future, or null/undefined
 */
export function isValidEndDate(date: unknown): boolean {
  if (date === null || date === undefined) {
    return true;
  }

  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return false;
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the input date at midnight for comparison
  const inputDate = new Date(dateObj);
  inputDate.setHours(0, 0, 0, 0);

  return inputDate >= today;
}

/**
 * Validates that a MIME type is allowed for attachments
 * @param mimeType - The MIME type to validate
 * @returns true if the MIME type is in the allowed list
 */
export function isValidMimeType(mimeType: unknown): mimeType is string {
  if (typeof mimeType !== 'string') {
    return false;
  }
  return ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number]);
}
