/**
 * Unit Tests: Convener Week Management API Functions
 * Feature: convener-dashboard
 * Tests API client functions for week management
 * **Validates: Requirements 4.2**
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
  createWeek,
  getWeeks,
  Week,
  WeekFormData,
  WeekWithLessons,
} from '@/lib/api/convener';
import apiClient from '@/lib/api/client';

describe('Convener Week Management API', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWeek', () => {
    it('should create a week and return week data', async () => {
      const programmeId = '1';
      const weekFormData: WeekFormData = {
        weekNumber: 1,
        title: 'Introduction to Programming',
        startDate: '2026-03-01',
      };

      const mockWeekData: Week = {
        id: 'week-uuid-1',
        programmeId: 1,
        weekNumber: 1,
        title: 'Introduction to Programming',
        startDate: '2026-03-01',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Week created successfully',
          week: mockWeekData,
        },
      } as any);

      const result = await createWeek(programmeId, weekFormData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/v1/api/programmes/${programmeId}/weeks`,
        {
          week_number: 1,
          title: 'Introduction to Programming',
          start_date: '2026-03-01',
        }
      );
      expect(result).toEqual(mockWeekData);
    });

    it('should throw error when week creation fails', async () => {
      const programmeId = '1';
      const weekFormData: WeekFormData = {
        weekNumber: 1,
        title: 'Test Week',
        startDate: '2026-03-01',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: true,
          message: 'Week number already exists',
          data: null,
        },
      } as any);

      await expect(createWeek(programmeId, weekFormData)).rejects.toThrow(
        'Week number already exists'
      );
    });

    it('should throw error on network failure', async () => {
      const programmeId = '1';
      const weekFormData: WeekFormData = {
        weekNumber: 1,
        title: 'Test Week',
        startDate: '2026-03-01',
      };

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(createWeek(programmeId, weekFormData)).rejects.toThrow(
        'Network error'
      );
    });

    it('should use correct endpoint URL', async () => {
      const programmeId = '42';
      const weekFormData: WeekFormData = {
        weekNumber: 2,
        title: 'Advanced Topics',
        startDate: '2026-03-08',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Success',
          week: {
            id: 'week-uuid-2',
            programmeId: 42,
            weekNumber: 2,
            title: 'Advanced Topics',
            startDate: '2026-03-08',
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
          },
        },
      } as any);

      await createWeek(programmeId, weekFormData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/api/programmes/42/weeks',
        {
          week_number: 2,
          title: 'Advanced Topics',
          start_date: '2026-03-08',
        }
      );
    });

    it('should handle week with long title', async () => {
      const programmeId = '1';
      const longTitle = 'A'.repeat(200);
      const weekFormData: WeekFormData = {
        weekNumber: 1,
        title: longTitle,
        startDate: '2026-03-01',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Success',
          week: {
            id: 'week-uuid-1',
            programmeId: 1,
            weekNumber: 1,
            title: longTitle,
            startDate: '2026-03-01',
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
          },
        },
      } as any);

      const result = await createWeek(programmeId, weekFormData);

      expect(result.title).toBe(longTitle);
      expect(result.title.length).toBe(200);
    });
  });

  describe('getWeeks', () => {
    it('should fetch all weeks for a programme', async () => {
      const programmeId = '1';
      const mockWeeks: WeekWithLessons[] = [
        {
          id: 'week-uuid-1',
          programmeId: 1,
          weekNumber: 1,
          title: 'Introduction to Programming',
          startDate: '2026-03-01',
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T10:00:00Z',
          lessons: [
            {
              id: 'lesson-uuid-1',
              weekId: 'week-uuid-1',
              title: 'Getting Started',
              description: 'Introduction lesson',
              contentType: 'video',
              contentUrl: 'https://example.com/video1',
              orderIndex: 0,
              createdAt: '2026-01-15T10:00:00Z',
              updatedAt: '2026-01-15T10:00:00Z',
            },
          ],
        },
        {
          id: 'week-uuid-2',
          programmeId: 1,
          weekNumber: 2,
          title: 'Advanced Topics',
          startDate: '2026-03-08',
          createdAt: '2026-01-16T10:00:00Z',
          updatedAt: '2026-01-16T10:00:00Z',
          lessons: [],
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          error: false,
          message: 'Weeks fetched successfully',
          weeks: mockWeeks,
        },
      } as any);

      const result = await getWeeks(programmeId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/v1/api/programmes/${programmeId}/weeks`
      );
      expect(result).toEqual(mockWeeks);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no weeks exist', async () => {
      const programmeId = '1';

      mockApiClient.get.mockResolvedValue({
        data: {
          error: false,
          message: 'No weeks found',
          weeks: [],
        },
      } as any);

      const result = await getWeeks(programmeId);

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

      await expect(getWeeks(programmeId)).rejects.toThrow('Programme not found');
    });

    it('should handle weeks with multiple lessons', async () => {
      const programmeId = '1';
      const mockWeeks: WeekWithLessons[] = [
        {
          id: 'week-uuid-1',
          programmeId: 1,
          weekNumber: 1,
          title: 'Week 1',
          startDate: '2026-03-01',
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T10:00:00Z',
          lessons: [
            {
              id: 'lesson-1',
              weekId: 'week-uuid-1',
              title: 'Lesson 1',
              description: 'First lesson',
              contentType: 'video',
              contentUrl: 'https://example.com/video1',
              orderIndex: 0,
              createdAt: '2026-01-15T10:00:00Z',
              updatedAt: '2026-01-15T10:00:00Z',
            },
            {
              id: 'lesson-2',
              weekId: 'week-uuid-1',
              title: 'Lesson 2',
              description: 'Second lesson',
              contentType: 'pdf',
              contentUrl: 'https://example.com/doc.pdf',
              orderIndex: 1,
              createdAt: '2026-01-15T10:00:00Z',
              updatedAt: '2026-01-15T10:00:00Z',
            },
            {
              id: 'lesson-3',
              weekId: 'week-uuid-1',
              title: 'Lesson 3',
              description: 'Third lesson',
              contentType: 'link',
              contentUrl: 'https://example.com/resource',
              orderIndex: 2,
              createdAt: '2026-01-15T10:00:00Z',
              updatedAt: '2026-01-15T10:00:00Z',
            },
          ],
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          error: false,
          message: 'Success',
          weeks: mockWeeks,
        },
      } as any);

      const result = await getWeeks(programmeId);

      expect(result[0].lessons).toHaveLength(3);
    });
  });
});
