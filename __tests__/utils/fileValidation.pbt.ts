// Property-Based Tests for File Validation
// Feature: assignment-submission-system
// Property 6: File Validation
// Validates: Requirements 3.1, 3.2, 3.3

import * as fc from 'fast-check';
import { validateFileType, validateFileSize, validateFile } from '@/utils/fileValidation';
import { LocalFile } from '@/types/assignments';

describe('Property 6: File Validation', () => {
  describe('validateFileType', () => {
    it('should accept files with allowed extensions', () => {
      // Property: Files with allowed extensions (.pdf, .png, .jpg, .jpeg, .doc, .docx) should be valid
      const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allowedExtensions),
          fc.string({ minLength: 1, maxLength: 50 }),
          (extension, baseName) => {
            const fileName = `${baseName}${extension}`;
            const result = validateFileType(fileName);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files with disallowed extensions', () => {
      // Property: Files with disallowed extensions should be invalid with specific error message
      const disallowedExtensions = ['.exe', '.bat', '.sh', '.zip', '.rar', '.dmg', '.app'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...disallowedExtensions),
          fc.string({ minLength: 1, maxLength: 50 }),
          (extension, baseName) => {
            const fileName = `${baseName}${extension}`;
            const result = validateFileType(fileName);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('not supported');
            expect(result.error).toContain(extension);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive extensions', () => {
      // Property: Extensions should be validated case-insensitively
      const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allowedExtensions),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('upper', 'lower', 'mixed'),
          (extension, baseName, caseType) => {
            let finalExtension = extension;
            if (caseType === 'upper') {
              finalExtension = extension.toUpperCase();
            } else if (caseType === 'mixed') {
              finalExtension = extension.split('').map((c, i) => 
                i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
              ).join('');
            }
            
            const fileName = `${baseName}${finalExtension}`;
            const result = validateFileType(fileName);
            
            // Should be valid regardless of case
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateFileSize', () => {
    it('should accept files under or equal to 10MB', () => {
      // Property: Files with size <= 10MB should be valid
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: maxSize }),
          (fileSize) => {
            const result = validateFileSize(fileSize);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files over 10MB', () => {
      // Property: Files with size > 10MB should be invalid with specific error message
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      fc.assert(
        fc.property(
          fc.integer({ min: maxSize + 1, max: 100 * 1024 * 1024 }), // 10MB+ to 100MB
          (fileSize) => {
            const result = validateFileSize(fileSize);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('exceeds 10MB limit');
            expect(result.error).toContain('MB'); // Should show size in MB
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle boundary condition at exactly 10MB', () => {
      // Property: File at exactly 10MB should be valid
      const exactlyTenMB = 10 * 1024 * 1024;
      const result = validateFileSize(exactlyTenMB);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle boundary condition at 10MB + 1 byte', () => {
      // Property: File at 10MB + 1 byte should be invalid
      const justOverTenMB = 10 * 1024 * 1024 + 1;
      const result = validateFileSize(justOverTenMB);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateFile', () => {
    it('should validate both type and size correctly', () => {
      // Property: Files with valid type AND valid size should pass validation
      const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
      const maxSize = 10 * 1024 * 1024;
      
      fc.assert(
        fc.property(
          fc.record({
            uri: fc.string(),
            name: fc.tuple(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.constantFrom(...allowedExtensions)
            ).map(([base, ext]) => `${base}${ext}`),
            type: fc.string(),
            size: fc.integer({ min: 0, max: maxSize }),
          }),
          (file: LocalFile) => {
            const result = validateFile(file);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files with invalid type even if size is valid', () => {
      // Property: Files with invalid type should fail regardless of size
      const disallowedExtensions = ['.exe', '.bat', '.sh'];
      const maxSize = 10 * 1024 * 1024;
      
      fc.assert(
        fc.property(
          fc.record({
            uri: fc.string(),
            name: fc.tuple(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.constantFrom(...disallowedExtensions)
            ).map(([base, ext]) => `${base}${ext}`),
            type: fc.string(),
            size: fc.integer({ min: 0, max: maxSize }),
          }),
          (file: LocalFile) => {
            const result = validateFile(file);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('not supported');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files with invalid size even if type is valid', () => {
      // Property: Files with invalid size should fail regardless of type
      const allowedExtensions = ['.pdf', '.png', '.jpg'];
      const maxSize = 10 * 1024 * 1024;
      
      fc.assert(
        fc.property(
          fc.record({
            uri: fc.string(),
            name: fc.tuple(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.constantFrom(...allowedExtensions)
            ).map(([base, ext]) => `${base}${ext}`),
            type: fc.string(),
            size: fc.integer({ min: maxSize + 1, max: 100 * 1024 * 1024 }),
          }),
          (file: LocalFile) => {
            const result = validateFile(file);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('exceeds 10MB limit');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail with type error before size error', () => {
      // Property: When both type and size are invalid, type error should be returned first
      const disallowedExtensions = ['.exe', '.bat'];
      const maxSize = 10 * 1024 * 1024;
      
      fc.assert(
        fc.property(
          fc.record({
            uri: fc.string(),
            name: fc.tuple(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.constantFrom(...disallowedExtensions)
            ).map(([base, ext]) => `${base}${ext}`),
            type: fc.string(),
            size: fc.integer({ min: maxSize + 1, max: 100 * 1024 * 1024 }),
          }),
          (file: LocalFile) => {
            const result = validateFile(file);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            // Type error should come first
            expect(result.error).toContain('not supported');
            expect(result.error).not.toContain('exceeds');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
