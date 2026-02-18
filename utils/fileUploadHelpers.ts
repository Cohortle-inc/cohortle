// File Upload Helper Utilities
// Extracted logic from FileUploadInput component for testability

import { Ionicons } from '@expo/vector-icons';

/**
 * Get file icon based on file type
 * @param fileName - Name of the file
 * @returns Icon name for the file type
 */
export function getFileIcon(fileName: string): keyof typeof Ionicons.glyphMap {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  switch (extension) {
    case '.pdf':
      return 'document-text';
    case '.png':
    case '.jpg':
    case '.jpeg':
      return 'image';
    case '.doc':
    case '.docx':
      return 'document';
    default:
      return 'document-attach';
  }
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

/**
 * Check if adding new files would exceed max files limit
 * @param currentCount - Current number of files
 * @param newCount - Number of new files to add
 * @param maxFiles - Maximum allowed files
 * @returns True if would exceed limit
 */
export function wouldExceedMaxFiles(
  currentCount: number,
  newCount: number,
  maxFiles: number
): boolean {
  return currentCount + newCount > maxFiles;
}

/**
 * Get error message for exceeding max files
 * @param maxFiles - Maximum allowed files
 * @returns Error message
 */
export function getMaxFilesError(maxFiles: number): string {
  return `You can only upload up to ${maxFiles} files. Please remove some files and try again.`;
}
