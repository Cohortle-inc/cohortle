/**
 * Unit Tests: Convener Cohort Management API Functions
 * Feature: convener-dashboard
 * Tests API client functions for cohort management
 * **Validates: Requirements 3.2**
 */

import axios from 'axios';

// Mock axios module first
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the API client module
jest.mock('@/lib/api/client', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return mockAxiosInstance;
});

import {
  createCohort,
  getCohorts,
  checkEnrollmentCodeAvailability,
  Cohort,
  CohortFormData,
} from '@/lib/api/convener';
import apiClient from '@/lib/api/client';

describe('Convener Cohort Management API', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCohort', () => {
    it('should create a cohort and return cohort data', async () => {
      const programmeId = '1';
      const cohortFormData: CohortFormData = {
        name: 'Spring 2026 Cohort',
        enrollmentCode: 'SPRING-2026',
        startDate: '2026-03-01',
      };

      const mockCohortData: Cohort = {
        id: 1,
        programmeId: 1,
        name: 'Spring 2026 Cohort',
        enrollmentCode: 'SPRING-2026',
        startDate: '2026-03-01',
        status: 'active',
        enrolledCount: 0,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Cohort created successfully',
          cohort: mockCohortData,
        },
      } as any);

      const result = await createCohort(programmeId, cohortFormData);

      // Expect the API to be called with snake_case data (transformed from camelCase)
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/v1/api/programmes/${programmeId}/cohorts`,
        {
          name: 'Spring 2026 Cohort',
          enrollment_code: 'SPRING-2026',
          start_date: '2026-03-01',
        }
      );
      expect(result).toEqual(mockCohortData);
      expect(result.name).toBe('Spring 2026 Cohort');
      expect(result.enrollmentCode).toBe('SPRING-2026');
      expect(result.status).toBe('active');
      expect(result.enrolledCount).toBe(0);
    });

    it('should throw error when cohort creation fails', async () => {
      const programmeId = '1';
      const cohortFormData: CohortFormData = {
        name: 'Test Cohort',
        enrollmentCode: 'TEST-2026',
        startDate: '2026-03-01',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: true,
          message: 'Enrollment code already exists',
          data: null,
        },
      } as any);

      await expect(createCohort(programmeId, cohortFormData)).rejects.toThrow(
        'Enrollment code already exists'
      );
    });

    it('should throw error on network failure', async () => {
      const programmeId = '1';
      const cohortFormData: CohortFormData = {
        name: 'Test Cohort',
        enrollmentCode: 'TEST-2026',
        startDate: '2026-03-01',
      };

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(createCohort(programmeId, cohortFormData)).rejects.toThrow(
        'Network error'
      );
    });

    it('should use correct endpoint URL', async () => {
      const programmeId = '42';
      const cohortFormData: CohortFormData = {
        name: 'Test Cohort',
        enrollmentCode: 'TEST-2026',
        startDate: '2026-03-01',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Success',
          data: {
            id: 1,
            programmeId: 42,
            name: 'Test Cohort',
            enrollmentCode: 'TEST-2026',
            startDate: '2026-03-01',
            status: 'active',
            enrolledCount: 0,
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
          },
        },
      } as any);

      await createCohort(programmeId, cohortFormData);

      // Expect the API to be called with snake_case data (transformed from camelCase)
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/api/programmes/42/cohorts',
        {
          name: 'Test Cohort',
          enrollment_code: 'TEST-2026',
          start_date: '2026-03-01',
        }
      );
    });
  });

  describe('getCohorts', () => {
    it('should fetch all cohorts for a programme', async () => {
      const programmeId = '1';
      const mockCohorts: Cohort[] = [
        {
          id: 1,
          programmeId: 1,
          name: 'Spring 2026 Cohort',
          enrollmentCode: 'SPRING-2026',
          startDate: '2026-03-01',
          status: 'active',
          enrolledCount: 15,
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T10:00:00Z',
        },
        {
          id: 2,
          programmeId: 1,
          name: 'Summer 2026 Cohort',
          enrollmentCode: 'SUMMER-2026',
          startDate: '2026-06-01',
          status: 'active',
          enrolledCount: 8,
          createdAt: '2026-04-01T10:00:00Z',
          updatedAt: '2026-04-01T10:00:00Z',
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          error: false,
          message: 'Cohorts fetched successfully',
          data: mockCohorts,
        },
      } as any);

      const result = await getCohorts(programmeId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/v1/api/programmes/${programmeId}/cohorts`
      );
      expect(result).toEqual(mockCohorts);
      expect(result).toHaveLength(2);
      expect(result[0].enrollmentCode).toBe('SPRING-2026');
      expect(result[1].enrollmentCode).toBe('SUMMER-2026');
    });

    it('should return empty array when no cohorts exist', async () => {
      const programmeId = '1';

      mockApiClient.get.mockResolvedValue({
        data: {
          error: false,
          message: 'No cohorts found',
          data: [],
        },
      } as any);

      const result = await getCohorts(programmeId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when fetch fails', async () => {
      const programmeId = '1';

      mockApiClient.get.mockResolvedValue({
        data: {
          error: true,
          message: 'Programme not found',
          data: null,
        },
      } as any);

      await expect(getCohorts(programmeId)).rejects.toThrow('Programme not found');
    });

    it('should throw error on network failure', async () => {
      const programmeId = '1';

      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(getCohorts(programmeId)).rejects.toThrow('Network error');
    });
  });

  describe('checkEnrollmentCodeAvailability', () => {
    it('should return true when enrollment code is available', async () => {
      const enrollmentCode = 'NEW-CODE-2026';

      // Backend returns available directly, not nested in data
      mockApiClient.get.mockResolvedValue({
        data: {
          available: true,
        },
      } as any);

      const result = await checkEnrollmentCodeAvailability(enrollmentCode);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/api/enrollment-codes/check',
        {
          params: { code: enrollmentCode },
        }
      );
      expect(result).toBe(true);
    });

    it('should return false when enrollment code is already in use', async () => {
      const enrollmentCode = 'EXISTING-CODE';

      // Backend returns available directly, not nested in data
      mockApiClient.get.mockResolvedValue({
        data: {
          available: false,
        },
      } as any);

      const result = await checkEnrollmentCodeAvailability(enrollmentCode);

      expect(result).toBe(false);
    });

    it('should throw error when check fails', async () => {
      const enrollmentCode = 'TEST-CODE';

      mockApiClient.get.mockResolvedValue({
        data: {
          error: true,
          message: 'Failed to check enrollment code',
          data: null,
        },
      } as any);

      await expect(
        checkEnrollmentCodeAvailability(enrollmentCode)
      ).rejects.toThrow('Failed to check enrollment code');
    });

    it('should throw error on network failure', async () => {
      const enrollmentCode = 'TEST-CODE';

      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(
        checkEnrollmentCodeAvailability(enrollmentCode)
      ).rejects.toThrow('Network error');
    });

    it('should handle special characters in enrollment code', async () => {
      const enrollmentCode = 'CODE-WITH-DASHES-123';

      // Backend returns available directly, not nested in data
      mockApiClient.get.mockResolvedValue({
        data: {
          available: true,
        },
      } as any);

      await checkEnrollmentCodeAvailability(enrollmentCode);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/api/enrollment-codes/check',
        {
          params: { code: enrollmentCode },
        }
      );
    });
  });
});
