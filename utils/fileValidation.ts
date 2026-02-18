// File Validation Utilities for Assignment Submission System
// This module provides functions to validate file types and sizes before upload

import { FileValidationResult, LocalFile } from '@/types/assignments';

/**
 * Allowed file extensions for assignment submissions
 */
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates if a file type is supported
 * @param fileName - The name of the file to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileType(fileName: string): FileValidationResult {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type ${extension} is not supported. Allowed types: PDF, PNG, JPG, DOC, DOCX`,
    };
  }

  return { valid: true };
}

/**
 * Validates if a file size is within the allowed limit
 * @param size - The size of the file in bytes
 * @returns Validation result with error message if invalid
 */
export function validateFileSize(size: number): FileValidationResult {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit. Current size: ${(size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validates a file for both type and size
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: LocalFile): FileValidationResult {
  // Validate file type
  const typeValidation = validateFileType(file.name);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Validates multiple files
 * @param files - Array of files to validate
 * @returns Array of validation results, one for each file
 */
export function validateFiles(files: LocalFile[]): FileValidationResult[] {
  return files.map(file => validateFile(file));
}

/**
 * Gets a user-friendly error message for file validation
 * @param fileName - Name of the file
 * @param error - Error message from validation
 * @returns Formatted error message
 */
export function getFileValidationError(fileName: string, error: string): string {
  return `${fileName}: ${error}`;
}
