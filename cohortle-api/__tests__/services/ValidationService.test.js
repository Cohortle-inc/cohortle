/**
 * Unit tests for ValidationService
 * 
 * Tests custom validation rules including:
 * - programmeId validation (existence and ownership)
 */

const ValidationService = require('../../services/ValidationService');
const BackendSDK = require('../../core/BackendSDK');

// Mock BackendSDK
jest.mock('../../core/BackendSDK');

describe('ValidationService - Custom Validation Rules', () => {
  let mockSdk;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
    };

    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('programmeId validation rule', () => {
    it('should pass validation when programme exists', async () => {
      // Mock programme exists
      mockSdk.get.mockResolvedValue([
        { id: 1, name: 'Test Programme', user_id: 123 }
      ]);

      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: 1 }
      );

      expect(result.error).toBe(false);
      expect(mockSdk.setTable).toHaveBeenCalledWith('programmes');
      expect(mockSdk.get).toHaveBeenCalledWith({ id: 1 });
    });

    it('should fail validation when programme does not exist', async () => {
      // Mock programme does not exist
      mockSdk.get.mockResolvedValue([]);

      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: 999 }
      );

      expect(result.error).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.validation[0].field).toBe('programme_id');
      expect(result.validation[0].message).toMatch(/programme/i);
    });

    it('should pass validation regardless of ownership (ownership checked at route level)', async () => {
      // Mock programme exists with different owner
      // The validation rule only checks existence, not ownership
      mockSdk.get.mockResolvedValue([
        { id: 1, name: 'Test Programme', user_id: 456 }
      ]);

      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: 1 }
      );

      // Should pass because programme exists (ownership is checked separately)
      expect(result.error).toBe(false);
    });

    it('should fail validation with invalid programme_id format (string)', async () => {
      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: 'invalid', user_id: 123 }
      );

      expect(result.error).toBe(true);
      expect(result.validation).toBeDefined();
      // SDK should not be called for invalid format
      expect(mockSdk.get).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid programme_id format (negative number)', async () => {
      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: -1, user_id: 123 }
      );

      expect(result.error).toBe(true);
      expect(result.validation).toBeDefined();
      expect(mockSdk.get).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid programme_id format (zero)', async () => {
      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: 0, user_id: 123 }
      );

      expect(result.error).toBe(true);
      expect(result.validation).toBeDefined();
      expect(mockSdk.get).not.toHaveBeenCalled();
    });

    it('should fail validation with null programme_id', async () => {
      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: null, user_id: 123 }
      );

      expect(result.error).toBe(true);
      expect(result.validation).toBeDefined();
      expect(mockSdk.get).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSdk.get.mockRejectedValue(new Error('Database connection failed'));

      const result = await ValidationService.validateObject(
        { programme_id: 'required|programmeId' },
        { programme_id: 1, user_id: 123 }
      );

      expect(result.error).toBe(true);
      expect(result.validation).toBeDefined();
    });
  });

  describe('commaInt validation rule (existing)', () => {
    it('should pass validation with valid comma-separated integers', async () => {
      const result = await ValidationService.validateObject(
        { ids: 'commaInt' },
        { ids: '1,2,3,4,5' }
      );

      expect(result.error).toBe(false);
    });

    it('should pass validation with single integer', async () => {
      const result = await ValidationService.validateObject(
        { ids: 'commaInt' },
        { ids: '42' }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with non-integer values', async () => {
      const result = await ValidationService.validateObject(
        { ids: 'commaInt' },
        { ids: '1,2,abc,4' }
      );

      expect(result.error).toBe(true);
    });

    it('should fail validation with non-string input', async () => {
      const result = await ValidationService.validateObject(
        { ids: 'commaInt' },
        { ids: 123 }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('weekId validation rule', () => {
    it('should pass validation when week exists', async () => {
      const db = require('../../models');
      const mockWeek = { id: '123e4567-e89b-12d3-a456-426614174000', title: 'Test Week' };
      db.weeks = { findByPk: jest.fn().mockResolvedValue(mockWeek) };

      const result = await ValidationService.validateObject(
        { week_id: 'required|weekId' },
        { week_id: '123e4567-e89b-12d3-a456-426614174000' }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with invalid UUID format', async () => {
      const result = await ValidationService.validateObject(
        { week_id: 'required|weekId' },
        { week_id: 'not-a-uuid' }
      );

      expect(result.error).toBe(true);
    });

    it('should fail validation when week does not exist', async () => {
      const db = require('../../models');
      db.weeks = { findByPk: jest.fn().mockResolvedValue(null) };

      const result = await ValidationService.validateObject(
        { week_id: 'required|weekId' },
        { week_id: '123e4567-e89b-12d3-a456-426614174000' }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('enrollmentCodeFormat validation rule', () => {
    it('should pass validation with valid format', async () => {
      const result = await ValidationService.validateObject(
        { code: 'enrollmentCodeFormat' },
        { code: 'WLIMP-2026' }
      );

      expect(result.error).toBe(false);
    });

    it('should pass validation with lowercase', async () => {
      const result = await ValidationService.validateObject(
        { code: 'enrollmentCodeFormat' },
        { code: 'wlimp-2026' }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with invalid format (no hyphen)', async () => {
      const result = await ValidationService.validateObject(
        { code: 'enrollmentCodeFormat' },
        { code: 'WLIMP2026' }
      );

      expect(result.error).toBe(true);
    });

    it('should fail validation with invalid year format', async () => {
      const result = await ValidationService.validateObject(
        { code: 'enrollmentCodeFormat' },
        { code: 'WLIMP-26' }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('dateNotPast validation rule', () => {
    it('should pass validation with future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      const result = await ValidationService.validateObject(
        { start_date: 'dateNotPast' },
        { start_date: dateString }
      );

      expect(result.error).toBe(false);
    });

    it('should pass validation with today\'s date', async () => {
      const today = new Date().toISOString().split('T')[0];

      const result = await ValidationService.validateObject(
        { start_date: 'dateNotPast' },
        { start_date: today }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const dateString = pastDate.toISOString().split('T')[0];

      const result = await ValidationService.validateObject(
        { start_date: 'dateNotPast' },
        { start_date: dateString }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('dateAfter validation rule', () => {
    it('should pass validation when end_date is after start_date', async () => {
      const result = await ValidationService.validateObject(
        { 
          start_date: 'required|date',
          end_date: 'required|date|dateAfter:start_date'
        },
        { 
          start_date: '2026-01-01',
          end_date: '2026-12-31'
        }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation when end_date is before start_date', async () => {
      const result = await ValidationService.validateObject(
        { 
          start_date: 'required|date',
          end_date: 'required|date|dateAfter:start_date'
        },
        { 
          start_date: '2026-12-31',
          end_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(true);
    });

    it('should fail validation when dates are equal', async () => {
      const result = await ValidationService.validateObject(
        { 
          start_date: 'required|date',
          end_date: 'required|date|dateAfter:start_date'
        },
        { 
          start_date: '2026-01-01',
          end_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('uniqueEnrollmentCode validation rule', () => {
    it('should pass validation when code is unique', async () => {
      mockSdk.get.mockResolvedValue([]);

      const result = await ValidationService.validateObject(
        { enrollment_code: 'uniqueEnrollmentCode' },
        { enrollment_code: 'UNIQUE-2026' }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation when code already exists', async () => {
      mockSdk.get.mockResolvedValue([
        { id: 1, enrollment_code: 'WLIMP-2026' }
      ]);

      const result = await ValidationService.validateObject(
        { enrollment_code: 'uniqueEnrollmentCode' },
        { enrollment_code: 'WLIMP-2026' }
      );

      expect(result.error).toBe(true);
    });

    it('should pass validation when updating same cohort', async () => {
      mockSdk.get.mockResolvedValue([
        { id: 1, enrollment_code: 'WLIMP-2026' }
      ]);

      const result = await ValidationService.validateObject(
        { 
          id: 'integer',
          enrollment_code: 'uniqueEnrollmentCode'
        },
        { 
          id: 1,
          enrollment_code: 'WLIMP-2026'
        }
      );

      expect(result.error).toBe(false);
    });
  });

  describe('urlScheme validation rule', () => {
    it('should pass validation with http URL', async () => {
      const result = await ValidationService.validateObject(
        { url: 'urlScheme' },
        { url: 'http://example.com' }
      );

      expect(result.error).toBe(false);
    });

    it('should pass validation with https URL', async () => {
      const result = await ValidationService.validateObject(
        { url: 'urlScheme' },
        { url: 'https://example.com/path' }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with ftp URL', async () => {
      const result = await ValidationService.validateObject(
        { url: 'urlScheme' },
        { url: 'ftp://example.com' }
      );

      expect(result.error).toBe(true);
    });

    it('should fail validation with invalid URL', async () => {
      const result = await ValidationService.validateObject(
        { url: 'urlScheme' },
        { url: 'not-a-url' }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('contentTypeConditional validation rule', () => {
    it('should pass validation for video type with content_url', async () => {
      const result = await ValidationService.validateObject(
        { 
          content_type: 'required|in:video,link,pdf,text',
          content_url: 'string|contentTypeConditional'
        },
        { 
          content_type: 'video',
          content_url: 'https://youtube.com/watch?v=123'
        }
      );

      expect(result.error).toBe(false);
    });

    it('should pass validation for text type with content_text', async () => {
      const result = await ValidationService.validateObject(
        { 
          content_type: 'required|in:video,link,pdf,text',
          content_text: 'string|contentTypeConditional'
        },
        { 
          content_type: 'text',
          content_text: 'This is lesson content'
        }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation for video type without content_url', async () => {
      const result = await ValidationService.validateObject(
        { 
          content_type: 'required|in:video,link,pdf,text',
          content_url: 'contentTypeConditional'
        },
        { 
          content_type: 'video',
          content_url: ''
        }
      );

      expect(result.error).toBe(true);
    });

    it('should fail validation for text type without content_text', async () => {
      const result = await ValidationService.validateObject(
        { 
          content_type: 'required|in:video,link,pdf,text',
          content_text: 'contentTypeConditional'
        },
        { 
          content_type: 'text',
          content_text: ''
        }
      );

      expect(result.error).toBe(true);
    });
  });
});


describe('ValidationService - Validation Schemas', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
    };
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('PROGRAMME_VALIDATION schema', () => {
    it('should pass validation with valid programme data', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      const result = await ValidationService.validateObject(
        ValidationService.PROGRAMME_VALIDATION,
        {
          name: 'Test Programme',
          description: 'A test programme description',
          start_date: dateString
        }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with short name', async () => {
      const result = await ValidationService.validateObject(
        ValidationService.PROGRAMME_VALIDATION,
        {
          name: 'AB',
          start_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(true);
      expect(result.validation[0].field).toBe('name');
    });

    it('should fail validation with past start_date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const dateString = pastDate.toISOString().split('T')[0];

      const result = await ValidationService.validateObject(
        ValidationService.PROGRAMME_VALIDATION,
        {
          name: 'Test Programme',
          start_date: dateString
        }
      );

      expect(result.error).toBe(true);
      expect(result.validation.some(v => v.field === 'start_date')).toBe(true);
    });
  });

  describe('COHORT_VALIDATION schema', () => {
    beforeEach(() => {
      mockSdk.get.mockResolvedValue([{ id: 1, name: 'Test Programme' }]);
    });

    it('should pass validation with valid cohort data', async () => {
      mockSdk.get.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([]);

      const result = await ValidationService.validateObject(
        ValidationService.COHORT_VALIDATION,
        {
          programme_id: 1,
          name: 'Test Cohort',
          enrollment_code: 'TEST-2026',
          start_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with invalid programme_id', async () => {
      mockSdk.get.mockResolvedValue([]);

      const result = await ValidationService.validateObject(
        ValidationService.COHORT_VALIDATION,
        {
          programme_id: 999,
          name: 'Test Cohort',
          enrollment_code: 'TEST-2026',
          start_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(true);
    });

    it('should fail validation with duplicate enrollment_code', async () => {
      mockSdk.get
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([{ id: 2, enrollment_code: 'TEST-2026' }]);

      const result = await ValidationService.validateObject(
        ValidationService.COHORT_VALIDATION,
        {
          programme_id: 1,
          name: 'Test Cohort',
          enrollment_code: 'TEST-2026',
          start_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('WEEK_VALIDATION schema', () => {
    beforeEach(() => {
      mockSdk.get.mockResolvedValue([{ id: 1, name: 'Test Programme' }]);
    });

    it('should pass validation with valid week data', async () => {
      const result = await ValidationService.validateObject(
        ValidationService.WEEK_VALIDATION,
        {
          programme_id: 1,
          week_number: 1,
          title: 'Week 1: Introduction',
          start_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with invalid week_number', async () => {
      const result = await ValidationService.validateObject(
        ValidationService.WEEK_VALIDATION,
        {
          programme_id: 1,
          week_number: 0,
          title: 'Week 0',
          start_date: '2026-01-01'
        }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('LESSON_VALIDATION schema', () => {
    beforeEach(() => {
      const db = require('../../models');
      db.weeks = { 
        findByPk: jest.fn().mockResolvedValue({ 
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Week'
        })
      };
    });

    it('should pass validation with valid lesson data (video)', async () => {
      const result = await ValidationService.validateObject(
        ValidationService.LESSON_VALIDATION,
        {
          week_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Lesson',
          description: 'A test lesson',
          content_type: 'video',
          content_url: 'https://youtube.com/watch?v=123',
          order_index: 0
        }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with invalid week_id format', async () => {
      const result = await ValidationService.validateObject(
        ValidationService.LESSON_VALIDATION,
        {
          week_id: 'not-a-uuid',
          title: 'Test Lesson',
          content_type: 'video',
          content_url: 'https://youtube.com/watch?v=123',
          order_index: 0
        }
      );

      expect(result.error).toBe(true);
    });
  });

  describe('ENROLLMENT_VALIDATION schema', () => {
    it('should pass validation with valid enrollment code', async () => {
      const result = await ValidationService.validateObject(
        ValidationService.ENROLLMENT_VALIDATION,
        {
          enrollment_code: 'WLIMP-2026'
        }
      );

      expect(result.error).toBe(false);
    });

    it('should fail validation with invalid format', async () => {
      const result = await ValidationService.validateObject(
        ValidationService.ENROLLMENT_VALIDATION,
        {
          enrollment_code: 'INVALID'
        }
      );

      expect(result.error).toBe(true);
    });
  });
});

describe('ValidationService - Error Response Formatting', () => {
  describe('formatValidationError', () => {
    it('should return standardized error format with field, message, and rule', async () => {
      const result = await ValidationService.validateObject(
        { name: 'required|string|minLength:3' },
        { name: 'AB' }
      );

      expect(result.error).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.validation[0]).toHaveProperty('field');
      expect(result.validation[0]).toHaveProperty('message');
      expect(result.validation[0]).toHaveProperty('rule');
    });

    it('should return multiple validation errors', async () => {
      const result = await ValidationService.validateObject(
        { 
          name: 'required|string|minLength:3',
          email: 'required|email'
        },
        { 
          name: 'AB',
          email: 'invalid-email'
        }
      );

      expect(result.error).toBe(true);
      expect(result.validation.length).toBeGreaterThan(1);
    });
  });

  describe('createValidationErrorResponse', () => {
    it('should create consistent error response format', () => {
      const validationErrors = [
        { field: 'name', message: 'Name is required', rule: 'required' },
        { field: 'email', message: 'Invalid email', rule: 'email' }
      ];

      const response = ValidationService.createValidationErrorResponse(validationErrors);

      expect(response).toEqual({
        error: true,
        message: 'Validation failed',
        validation_errors: validationErrors
      });
    });
  });
});
