/**
 * Unit tests for EnrollmentService
 * 
 * Tests the core enrollment functionality including:
 * - Code validation
 * - Duplicate enrollment checking
 * - Enrollment creation
 */

const EnrollmentService = require('../../services/EnrollmentService');
const db = require('../../models');
const { cohorts, enrollments, programmes } = db;

// Mock the database models
jest.mock('../../models', () => ({
  cohorts: {
    findOne: jest.fn(),
  },
  enrollments: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  programmes: {},
}));

describe('EnrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCode', () => {
    it('should reject invalid code format - missing hyphen', async () => {
      await expect(EnrollmentService.validateCode('WLIMP2026')).rejects.toThrow(
        'Invalid code format. Use format: PROGRAMME-YEAR'
      );
    });

    it('should reject invalid code format - empty string', async () => {
      await expect(EnrollmentService.validateCode('')).rejects.toThrow(
        'Invalid code format. Use format: PROGRAMME-YEAR'
      );
    });

    it('should reject invalid code format - null', async () => {
      await expect(EnrollmentService.validateCode(null)).rejects.toThrow(
        'Invalid code format. Use format: PROGRAMME-YEAR'
      );
    });

    it('should reject invalid code format - wrong year format', async () => {
      await expect(EnrollmentService.validateCode('WLIMP-26')).rejects.toThrow(
        'Invalid code format. Use format: PROGRAMME-YEAR'
      );
    });

    it('should reject non-existent code', async () => {
      cohorts.findOne.mockResolvedValue(null);

      await expect(EnrollmentService.validateCode('WLIMP-2026')).rejects.toThrow(
        'Enrollment code not found. Please check the code and try again.'
      );
    });

    it('should accept valid code and return cohort', async () => {
      const mockCohort = {
        id: 1,
        programme_id: 1,
        enrollment_code: 'WLIMP-2026',
        programme: {
          id: 1,
          name: 'WLIMP Programme',
          description: 'Test programme',
        },
      };

      cohorts.findOne.mockResolvedValue(mockCohort);

      const result = await EnrollmentService.validateCode('WLIMP-2026');
      expect(result).toEqual(mockCohort);
      expect(cohorts.findOne).toHaveBeenCalledWith({
        where: { enrollment_code: 'WLIMP-2026' },
        include: [
          {
            model: programmes,
            as: 'programme',
            attributes: ['id', 'name', 'description'],
          },
        ],
      });
    });

    it('should trim whitespace from code', async () => {
      const mockCohort = {
        id: 1,
        programme_id: 1,
        enrollment_code: 'WLIMP-2026',
      };

      cohorts.findOne.mockResolvedValue(mockCohort);

      await EnrollmentService.validateCode('  WLIMP-2026  ');
      expect(cohorts.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { enrollment_code: 'WLIMP-2026' },
        })
      );
    });
  });

  describe('checkExistingEnrollment', () => {
    it('should return true if enrollment exists', async () => {
      enrollments.findOne.mockResolvedValue({ id: 'uuid-123', user_id: 1, cohort_id: 1 });

      const result = await EnrollmentService.checkExistingEnrollment(1, 1);
      expect(result).toBe(true);
      expect(enrollments.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, cohort_id: 1 },
      });
    });

    it('should return false if enrollment does not exist', async () => {
      enrollments.findOne.mockResolvedValue(null);

      const result = await EnrollmentService.checkExistingEnrollment(1, 1);
      expect(result).toBe(false);
    });
  });

  describe('enrollLearner', () => {
    it('should create new enrollment if not already enrolled', async () => {
      enrollments.findOne.mockResolvedValue(null);
      const mockEnrollment = {
        id: 'uuid-123',
        user_id: 1,
        cohort_id: 1,
        enrolled_at: new Date(),
      };
      enrollments.create.mockResolvedValue(mockEnrollment);

      const result = await EnrollmentService.enrollLearner(1, 1);
      expect(result).toEqual(mockEnrollment);
      expect(enrollments.create).toHaveBeenCalledWith({
        user_id: 1,
        cohort_id: 1,
        enrolled_at: expect.any(Date),
      });
    });

    it('should return existing enrollment if already enrolled', async () => {
      const mockEnrollment = {
        id: 'uuid-123',
        user_id: 1,
        cohort_id: 1,
        enrolled_at: new Date('2024-01-01'),
      };
      enrollments.findOne.mockResolvedValue(mockEnrollment);

      const result = await EnrollmentService.enrollLearner(1, 1);
      expect(result).toEqual(mockEnrollment);
      expect(enrollments.create).not.toHaveBeenCalled();
    });

    it('should handle race condition with unique constraint error', async () => {
      const mockEnrollment = {
        id: 'uuid-123',
        user_id: 1,
        cohort_id: 1,
        enrolled_at: new Date('2024-01-01'),
      };

      // First call returns null (not enrolled)
      // Create throws unique constraint error
      // Second findOne call returns existing enrollment
      enrollments.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockEnrollment);

      const error = new Error('Unique constraint violation');
      error.name = 'SequelizeUniqueConstraintError';
      enrollments.create.mockRejectedValue(error);

      const result = await EnrollmentService.enrollLearner(1, 1);
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('enrollWithCode', () => {
    it('should complete full enrollment flow', async () => {
      const mockCohort = {
        id: 1,
        programme_id: 1,
        enrollment_code: 'WLIMP-2026',
        programme: {
          id: 1,
          name: 'WLIMP Programme',
          description: 'Test programme',
        },
      };

      const mockEnrollment = {
        id: 'uuid-123',
        user_id: 1,
        cohort_id: 1,
        enrolled_at: new Date(),
      };

      cohorts.findOne.mockResolvedValue(mockCohort);
      enrollments.findOne.mockResolvedValue(null);
      enrollments.create.mockResolvedValue(mockEnrollment);

      const result = await EnrollmentService.enrollWithCode(1, 'WLIMP-2026');

      expect(result).toMatchObject({
        success: true,
        programme_id: 1,
        programme_name: 'WLIMP Programme',
        cohort_id: 1,
        enrollment_id: 'uuid-123',
      });
    });

    it('should handle invalid code in full flow', async () => {
      cohorts.findOne.mockResolvedValue(null);

      await expect(EnrollmentService.enrollWithCode(1, 'WLIMP-2026')).rejects.toThrow(
        'Enrollment code not found'
      );
    });
  });
});
