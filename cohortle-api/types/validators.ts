/**
 * Validation helpers for WLIMP types
 * 
 * These functions validate input data against the defined interfaces
 * and provide runtime type checking.
 */

import {
  CreateProgrammeInput,
  CreateCohortInput,
  CreateWeekInput,
  CreateLessonInput,
  UpdateLessonInput,
  EnrollmentInput,
  ReorderLessonsInput,
} from './wlimp';

/**
 * Validates enrollment code format (WORD-YEAR)
 * @param code - Enrollment code to validate
 * @returns true if valid, false otherwise
 */
export function isValidEnrollmentCode(code: string): boolean {
  const pattern = /^[A-Z0-9]+-\d{4}$/i;
  return pattern.test(code);
}

/**
 * Validates content type
 * @param type - Content type to validate
 * @returns true if valid, false otherwise
 */
export function isValidContentType(type: string): type is 'video' | 'link' | 'pdf' {
  return ['video', 'link', 'pdf'].includes(type);
}

/**
 * Validates programme type
 * @param type - Programme type to validate
 * @returns true if valid, false otherwise
 */
export function isValidProgrammeType(
  type: string
): type is 'scheduled' | 'structured' | 'self_paced' {
  return ['scheduled', 'structured', 'self_paced'].includes(type);
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates date string format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateString(date: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(date)) {
    return false;
  }
  
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validates CreateProgrammeInput
 * @param input - Input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateCreateProgrammeInput(
  input: any
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!input.community_id || typeof input.community_id !== 'number') {
    errors.push({ field: 'community_id', message: 'Community ID is required and must be a number' });
  }

  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
  }

  if (input.name && input.name.length > 255) {
    errors.push({ field: 'name', message: 'Name must not exceed 255 characters' });
  }

  if (input.type && !isValidProgrammeType(input.type)) {
    errors.push({
      field: 'type',
      message: 'Type must be one of: scheduled, structured, self_paced',
    });
  }

  return errors;
}

/**
 * Validates CreateCohortInput
 * @param input - Input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateCreateCohortInput(input: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!input.programme_id || typeof input.programme_id !== 'number') {
    errors.push({ field: 'programme_id', message: 'Programme ID is required and must be a number' });
  }

  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
  }

  if (input.name && input.name.length > 255) {
    errors.push({ field: 'name', message: 'Name must not exceed 255 characters' });
  }

  if (input.enrollment_code && !isValidEnrollmentCode(input.enrollment_code)) {
    errors.push({
      field: 'enrollment_code',
      message: 'Enrollment code must follow format: WORD-YEAR (e.g., WLIMP-2026)',
    });
  }

  if (input.start_date && !isValidDateString(input.start_date)) {
    errors.push({
      field: 'start_date',
      message: 'Start date must be in YYYY-MM-DD format',
    });
  }

  if (input.end_date && !isValidDateString(input.end_date)) {
    errors.push({
      field: 'end_date',
      message: 'End date must be in YYYY-MM-DD format',
    });
  }

  return errors;
}

/**
 * Validates CreateWeekInput
 * @param input - Input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateCreateWeekInput(input: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!input.programme_id || typeof input.programme_id !== 'number') {
    errors.push({ field: 'programme_id', message: 'Programme ID is required and must be a number' });
  }

  if (!input.week_number || typeof input.week_number !== 'number' || input.week_number < 1) {
    errors.push({
      field: 'week_number',
      message: 'Week number is required and must be a positive integer',
    });
  }

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string' });
  }

  if (input.title && input.title.length > 255) {
    errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
  }

  if (!input.start_date || !isValidDateString(input.start_date)) {
    errors.push({
      field: 'start_date',
      message: 'Start date is required and must be in YYYY-MM-DD format',
    });
  }

  return errors;
}

/**
 * Validates CreateLessonInput
 * @param input - Input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateCreateLessonInput(input: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!input.week_id || typeof input.week_id !== 'string') {
    errors.push({ field: 'week_id', message: 'Week ID is required and must be a string (UUID)' });
  }

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string' });
  }

  if (input.title && input.title.length > 255) {
    errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
  }

  if (!input.content_type || !isValidContentType(input.content_type)) {
    errors.push({
      field: 'content_type',
      message: 'Content type is required and must be one of: video, link, pdf',
    });
  }

  if (!input.content_url || typeof input.content_url !== 'string' || !isValidUrl(input.content_url)) {
    errors.push({
      field: 'content_url',
      message: 'Content URL is required and must be a valid URL',
    });
  }

  if (
    input.order_index === undefined ||
    typeof input.order_index !== 'number' ||
    input.order_index < 0
  ) {
    errors.push({
      field: 'order_index',
      message: 'Order index is required and must be a non-negative integer',
    });
  }

  return errors;
}

/**
 * Validates UpdateLessonInput
 * @param input - Input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateUpdateLessonInput(input: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string' });
    }
    if (input.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
    }
  }

  if (input.content_type !== undefined && !isValidContentType(input.content_type)) {
    errors.push({
      field: 'content_type',
      message: 'Content type must be one of: video, link, pdf',
    });
  }

  if (input.content_url !== undefined) {
    if (typeof input.content_url !== 'string' || !isValidUrl(input.content_url)) {
      errors.push({ field: 'content_url', message: 'Content URL must be a valid URL' });
    }
  }

  if (input.order_index !== undefined) {
    if (typeof input.order_index !== 'number' || input.order_index < 0) {
      errors.push({ field: 'order_index', message: 'Order index must be a non-negative integer' });
    }
  }

  return errors;
}

/**
 * Validates EnrollmentInput
 * @param input - Input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateEnrollmentInput(input: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!input.code || typeof input.code !== 'string') {
    errors.push({ field: 'code', message: 'Enrollment code is required' });
  } else if (!isValidEnrollmentCode(input.code)) {
    errors.push({
      field: 'code',
      message: 'Invalid code format. Use format: PROGRAMME-YEAR (e.g., WLIMP-2026)',
    });
  }

  return errors;
}

/**
 * Validates ReorderLessonsInput
 * @param input - Input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateReorderLessonsInput(input: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!Array.isArray(input.lesson_ids)) {
    errors.push({ field: 'lesson_ids', message: 'Lesson IDs must be an array' });
  } else if (input.lesson_ids.length === 0) {
    errors.push({ field: 'lesson_ids', message: 'Lesson IDs array cannot be empty' });
  } else if (!input.lesson_ids.every((id: any) => typeof id === 'string')) {
    errors.push({ field: 'lesson_ids', message: 'All lesson IDs must be strings (UUIDs)' });
  }

  return errors;
}
