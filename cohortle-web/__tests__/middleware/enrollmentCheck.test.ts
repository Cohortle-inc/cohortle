/**
 * Enrollment Check Tests
 * Tests for authentication and enrollment verification on protected routes
 * 
 * Requirements: 8.1, 8.3
 */

import { isEnrolledInProgramme } from '@/lib/api/programmes';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Enrollment Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnrolledInProgramme', () => {
    it('should return true when user is enrolled in the programme', async () => {
      const apiClient = require('@/lib/api/client').default;
      
      // Mock enrolled programmes response
      apiClient.get.mockResolvedValueOnce({
        data: {
          error: false,
          message: 'Enrolled programmes fetched successfully',
          programmes: [
            { id: 1, name: 'WLIMP', currentWeek: 2, totalWeeks: 10 },
            { id: 2, name: 'Other Programme', currentWeek: 1, totalWeeks: 5 },
          ],
        },
      });

      const result = await isEnrolledInProgramme('1');
      expect(result).toBe(true);
    });

    it('should return false when user is not enrolled in the programme', async () => {
      const apiClient = require('@/lib/api/client').default;
      
      // Mock enrolled programmes response
      apiClient.get.mockResolvedValueOnce({
        data: {
          error: false,
          message: 'Enrolled programmes fetched successfully',
          programmes: [
            { id: 2, name: 'Other Programme', currentWeek: 1, totalWeeks: 5 },
          ],
        },
      });

      const result = await isEnrolledInProgramme('1');
      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      const apiClient = require('@/lib/api/client').default;
      
      // Mock API error
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await isEnrolledInProgramme('1');
      expect(result).toBe(false);
    });

    it('should return false when user has no enrollments', async () => {
      const apiClient = require('@/lib/api/client').default;
      
      // Mock empty enrolled programmes response
      apiClient.get.mockResolvedValueOnce({
        data: {
          error: false,
          message: 'Enrolled programmes fetched successfully',
          programmes: [],
        },
      });

      const result = await isEnrolledInProgramme('1');
      expect(result).toBe(false);
    });
  });
});
