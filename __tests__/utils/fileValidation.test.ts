// Unit Tests for File Validation Edge Cases
// Feature: assignment-submission-system
// Validates: Requirements 3.1, 3.2, 3.3

import {
  validateFileType,
  validateFileSize,
  validateFile,
  validateFiles,
  getFileValidationError,
} from '@/utils/fileValidation';
import { LocalFile } from '@/types/assignments';

describe('File Validation - Edge Cases', () => {
  describe('validateFileType', () => {
    it('should accept .pdf files', () => {
      const result = validateFileType('document.pdf');
      expect(result.valid).toBe(true);
    });

    it('should accept .PDF files (uppercase)', () => {
      const result = validateFileType('document.PDF');
      expect(result.valid).toBe(true);
    });

    it('should accept .PdF files (mixed case)', () => {
      const result = validateFileType('document.PdF');
      expect(result.valid).toBe(true);
    });

    it('should accept all allowed extensions', () => {
      const allowedFiles = [
        'doc.pdf',
        'image.png',
        'photo.jpg',
        'picture.jpeg',
        'text.doc',
        'report.docx',
      ];

      allowedFiles.forEach(fileName => {
        const result = validateFileType(fileName);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject .exe files', () => {
      const result = validateFileType('virus.exe');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.exe');
      expect(result.error).toContain('not supported');
    });

    it('should reject files with no extension', () => {
      const result = validateFileType('noextension');
      expect(result.valid).toBe(false);
    });

    it('should reject files with multiple dots', () => {
      const result = validateFileType('file.backup.exe');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.exe');
    });

    it('should handle files with spaces in name', () => {
      const result = validateFileType('my document.pdf');
      expect(result.valid).toBe(true);
    });

    it('should handle files with special characters', () => {
      const result = validateFileType('report_2024-01-15.pdf');
      expect(result.valid).toBe(true);
    });

    it('should provide specific error message for invalid type', () => {
      const result = validateFileType('script.sh');
      expect(result.error).toContain('.sh');
      expect(result.error).toContain('PDF, PNG, JPG, DOC, DOCX');
    });
  });

  describe('validateFileSize', () => {
    const MB = 1024 * 1024;

    it('should accept 0 byte files', () => {
      const result = validateFileSize(0);
      expect(result.valid).toBe(true);
    });

    it('should accept 1 byte files', () => {
      const result = validateFileSize(1);
      expect(result.valid).toBe(true);
    });

    it('should accept exactly 10MB files', () => {
      const result = validateFileSize(10 * MB);
      expect(result.valid).toBe(true);
    });

    it('should reject 10MB + 1 byte files', () => {
      const result = validateFileSize(10 * MB + 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds 10MB limit');
    });

    it('should reject 11MB files', () => {
      const result = validateFileSize(11 * MB);
      expect(result.valid).toBe(false);
    });

    it('should reject 100MB files', () => {
      const result = validateFileSize(100 * MB);
      expect(result.valid).toBe(false);
    });

    it('should show file size in MB in error message', () => {
      const result = validateFileSize(15 * MB);
      expect(result.error).toContain('15.00MB');
    });

    it('should show file size with 2 decimal places', () => {
      const result = validateFileSize(10.5 * MB);
      expect(result.error).toContain('10.50MB');
    });

    it('should handle fractional MB sizes', () => {
      const result = validateFileSize(10.1 * MB);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10.10MB');
    });
  });

  describe('validateFile', () => {
    it('should accept valid file with all correct properties', () => {
      const file: LocalFile = {
        uri: 'file://path/to/document.pdf',
        name: 'document.pdf',
        type: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB
      };

      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject file with invalid type', () => {
      const file: LocalFile = {
        uri: 'file://path/to/script.exe',
        name: 'script.exe',
        type: 'application/exe',
        size: 1024,
      };

      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject file with invalid size', () => {
      const file: LocalFile = {
        uri: 'file://path/to/large.pdf',
        name: 'large.pdf',
        type: 'application/pdf',
        size: 20 * 1024 * 1024, // 20MB
      };

      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds 10MB limit');
    });

    it('should check type before size', () => {
      const file: LocalFile = {
        uri: 'file://path/to/large.exe',
        name: 'large.exe',
        type: 'application/exe',
        size: 20 * 1024 * 1024, // 20MB - both invalid
      };

      const result = validateFile(file);
      expect(result.valid).toBe(false);
      // Should return type error, not size error
      expect(result.error).toContain('not supported');
      expect(result.error).not.toContain('exceeds');
    });

    it('should handle file with empty name', () => {
      const file: LocalFile = {
        uri: 'file://path/to/file',
        name: '',
        type: 'application/pdf',
        size: 1024,
      };

      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFiles', () => {
    it('should validate multiple files', () => {
      const files: LocalFile[] = [
        {
          uri: 'file://1.pdf',
          name: 'doc1.pdf',
          type: 'application/pdf',
          size: 1024,
        },
        {
          uri: 'file://2.png',
          name: 'image.png',
          type: 'image/png',
          size: 2048,
        },
      ];

      const results = validateFiles(files);
      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
    });

    it('should return validation result for each file', () => {
      const files: LocalFile[] = [
        {
          uri: 'file://valid.pdf',
          name: 'valid.pdf',
          type: 'application/pdf',
          size: 1024,
        },
        {
          uri: 'file://invalid.exe',
          name: 'invalid.exe',
          type: 'application/exe',
          size: 1024,
        },
        {
          uri: 'file://toolarge.pdf',
          name: 'toolarge.pdf',
          type: 'application/pdf',
          size: 20 * 1024 * 1024,
        },
      ];

      const results = validateFiles(files);
      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(false);
    });

    it('should handle empty array', () => {
      const results = validateFiles([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('getFileValidationError', () => {
    it('should format error message with file name', () => {
      const error = getFileValidationError('document.pdf', 'File is too large');
      expect(error).toBe('document.pdf: File is too large');
    });

    it('should handle long file names', () => {
      const longName = 'very_long_file_name_that_exceeds_normal_length.pdf';
      const error = getFileValidationError(longName, 'Invalid type');
      expect(error).toContain(longName);
      expect(error).toContain('Invalid type');
    });

    it('should handle special characters in file name', () => {
      const error = getFileValidationError('file (1).pdf', 'Error message');
      expect(error).toBe('file (1).pdf: Error message');
    });
  });
});
