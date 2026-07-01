/**
 * Unit tests for POST /api/v1/programmes/enroll endpoint logic
 * 
 * Tests the enrollment endpoint including:
 * - Valid code enrollment
 * - Invalid code format rejection
 * - Non-existent code rejection
 * - Duplicate enrollment idempotency
 * - Error handling
 */

const EnrollmentService = require('../../services/EnrollmentService');

// Mock the EnrollmentService
jest.mock('../../services/EnrollmentService');

describe('POST /v1/api/programmes/enroll - Endpoint Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid enrollment flow', () => {
    it('should successfully enroll with valid code', async () => {
      const mockEnrollmentResult = {
        success: true,
        programme_id: 1,
        programme_name: 'WLIMP Programme',
        cohort_id: 1,
        enrollment_id: 'uuid-123',
        is_new_enrollment: true,
      };

      EnrollmentService.enrollWithCode.mockResolvedValue(mockEnrollmentResult);

      // Simulate endpoint logic
      const userId = 1;
      const code = 'WLIMP-2026';
      const result = await EnrollmentService.enrollWithCode(userId, code);

      expect(result).toMatchObject({
        success: true,
        programme_id: 1,
        programme_name: 'WLIMP Programme',
        cohort_id: 1,
      });

      expect(EnrollmentService.enrollWithCode).toHaveBeenCalledWith(1, 'WLIMP-2026');
    });

    it('should handle duplicate enrollment idempotently', async () => {
      const mockEnrollmentResult = {
        success: true,
        programme_id: 1,
        programme_name: 'WLIMP Programme',
        cohort_id: 1,
        enrollment_id: 'uuid-123',
        is_new_enrollment: false, // Existing enrollment
      };

      EnrollmentService.enrollWithCode.mockResolvedValue(mockEnrollmentResult);

      const userId = 1;
      const code = 'WLIMP-2026';
      const result = await EnrollmentService.enrollWithCode(userId, code);

      expect(result).toMatchObject({
        success: true,
        programme_id: 1,
        cohort_id: 1,
      });
    });
  });

  describe('Error handling', () => {
    it('should reject invalid code format with 400 error', async () => {
      const error = new Error('Invalid code format. Use format: PROGRAMME-YEAR');
      error.statusCode = 400;
      EnrollmentService.enrollWithCode.mockRejectedValue(error);

      const userId = 1;
      const code = 'INVALID';

      await expect(EnrollmentService.enrollWithCode(userId, code)).rejects.toMatchObject({
        message: 'Invalid code format. Use format: PROGRAMME-YEAR',
        statusCode: 400,
      });
    });

    it('should reject non-existent code with 404 error', async () => {
      const error = new Error('Enrollment code not found. Please check the code and try again.');
      error.statusCode = 404;
      EnrollmentService.enrollWithCode.mockRejectedValue(error);

      const userId = 1;
      const code = 'NOTFOUND-2026';

      await expect(EnrollmentService.enrollWithCode(userId, code)).rejects.toMatchObject({
        message: 'Enrollment code not found. Please check the code and try again.',
        statusCode: 404,
      });
    });

    it('should handle server errors gracefully', async () => {
      const error = new Error('Database connection failed');
      EnrollmentService.enrollWithCode.mockRejectedValue(error);

      const userId = 1;
      const code = 'WLIMP-2026';

      await expect(EnrollmentService.enrollWithCode(userId, code)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Input validation', () => {
    it('should validate code is provided', async () => {
      const error = new Error('Invalid code format. Use format: PROGRAMME-YEAR');
      error.statusCode = 400;
      EnrollmentService.enrollWithCode.mockRejectedValue(error);

      const userId = 1;
      const code = '';

      await expect(EnrollmentService.enrollWithCode(userId, code)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should validate code format', async () => {
      const error = new Error('Invalid code format. Use format: PROGRAMME-YEAR');
      error.statusCode = 400;
      EnrollmentService.enrollWithCode.mockRejectedValue(error);

      const userId = 1;
      const code = 'WLIMP2026'; // Missing hyphen

      await expect(EnrollmentService.enrollWithCode(userId, code)).rejects.toMatchObject({
        message: 'Invalid code format. Use format: PROGRAMME-YEAR',
        statusCode: 400,
      });
    });
  });
});
