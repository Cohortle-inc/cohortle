/**
 * Google Drive URL Utilities
 *
 * Utilities for detecting Google Drive URLs, generating embed URLs,
 * mapping MIME types to lesson content types, and extracting file IDs.
 *
 * Supports four URL patterns:
 *   - drive.google.com/file/d/{fileId}/view
 *   - docs.google.com/document/d/{docId}/edit
 *   - docs.google.com/presentation/d/{presentationId}/edit
 *   - docs.google.com/spreadsheets/d/{spreadsheetId}/edit
 */

import { LessonUnitType } from '@/types/lesson';

// Regex patterns for each Drive URL type
const DRIVE_FILE_PATTERN = /drive\.google\.com\/file\/d\/([^/?#]+)/;
const DOCS_DOCUMENT_PATTERN = /docs\.google\.com\/document\/d\/([^/?#]+)/;
const DOCS_PRESENTATION_PATTERN = /docs\.google\.com\/presentation\/d\/([^/?#]+)/;
const DOCS_SPREADSHEET_PATTERN = /docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/;

// Also support slides.google.com as mentioned in Requirement 6.6
const SLIDES_PATTERN = /slides\.google\.com\/presentation\/d\/([^/?#]+)/;
const SHEETS_PATTERN = /sheets\.google\.com\/spreadsheets\/d\/([^/?#]+)/;

/**
 * Returns true if the URL is a Google Drive, Docs, Slides, or Sheets URL.
 *
 * Requirement 6.6, 7.1–7.4
 */
export function isDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return (
    DRIVE_FILE_PATTERN.test(url) ||
    DOCS_DOCUMENT_PATTERN.test(url) ||
    DOCS_PRESENTATION_PATTERN.test(url) ||
    DOCS_SPREADSHEET_PATTERN.test(url) ||
    SLIDES_PATTERN.test(url) ||
    SHEETS_PATTERN.test(url)
  );
}

/**
 * Extracts the file/document ID from a Google Drive URL.
 *
 * Returns null if the URL is not a recognised Drive URL.
 *
 * Requirement 7.1–7.4
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const patterns = [
    DRIVE_FILE_PATTERN,
    DOCS_DOCUMENT_PATTERN,
    DOCS_PRESENTATION_PATTERN,
    DOCS_SPREADSHEET_PATTERN,
    SLIDES_PATTERN,
    SHEETS_PATTERN,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Converts a Google Drive URL to the correct embed URL for iframe rendering.
 *
 * - drive.google.com/file/d/{id}/view  →  drive.google.com/file/d/{id}/preview
 * - docs.google.com/presentation/d/{id}/...  →  docs.google.com/presentation/d/{id}/embed
 * - docs.google.com/document/d/{id}/...  →  docs.google.com/document/d/{id}/preview
 * - docs.google.com/spreadsheets/d/{id}/...  →  docs.google.com/spreadsheets/d/{id}/preview
 *
 * Returns null if the URL is not a recognised Drive URL.
 *
 * Requirements 7.5, 7.6, 7.7
 */
export function getDriveEmbedUrl(url: string, mimeType?: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Drive file (PDF or other binary)
  const driveFileMatch = url.match(DRIVE_FILE_PATTERN);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  // Google Slides (presentation)
  const presentationMatch =
    url.match(DOCS_PRESENTATION_PATTERN) || url.match(SLIDES_PATTERN);
  if (presentationMatch && presentationMatch[1]) {
    return `https://docs.google.com/presentation/d/${presentationMatch[1]}/embed`;
  }

  // Google Docs (document)
  const documentMatch = url.match(DOCS_DOCUMENT_PATTERN);
  if (documentMatch && documentMatch[1]) {
    return `https://docs.google.com/document/d/${documentMatch[1]}/preview`;
  }

  // Google Sheets (spreadsheet)
  const spreadsheetMatch =
    url.match(DOCS_SPREADSHEET_PATTERN) || url.match(SHEETS_PATTERN);
  if (spreadsheetMatch && spreadsheetMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetMatch[1]}/preview`;
  }

  return null;
}

/**
 * Maps a Google Drive MIME type to a Cohortle lesson content type.
 *
 * Mapping:
 *   application/pdf                          → pdf
 *   application/vnd.google-apps.presentation → pdf
 *   application/vnd.google-apps.document     → link
 *   application/vnd.google-apps.spreadsheet  → link
 *   video/*                                  → link
 *   (anything else)                          → link  (safe default)
 *
 * Requirements 6.1–6.5
 */
export function mimeTypeToLessonType(mimeType: string): LessonUnitType {
  if (!mimeType || typeof mimeType !== 'string') {
    return 'link';
  }

  const normalised = mimeType.trim().toLowerCase();

  if (normalised === 'application/pdf') {
    return 'pdf';
  }

  if (normalised === 'application/vnd.google-apps.presentation') {
    return 'pdf';
  }

  if (normalised === 'application/vnd.google-apps.document') {
    return 'link';
  }

  if (normalised === 'application/vnd.google-apps.spreadsheet') {
    return 'link';
  }

  if (normalised.startsWith('video/')) {
    return 'link';
  }

  // Default for any unrecognised MIME type
  return 'link';
}
