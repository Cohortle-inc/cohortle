/**
 * Unit Tests: WLIMP Programme API Client Functions
 * Feature: wlimp-programme-rollout
 * Tests API client functions for WLIMP programmes
 * **Validates: Requirements 4.1, 4.2**
 */

import axios, { AxiosInstance } from 'axios';

// Mock axios module first
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the API client module
jest.mock('@/lib/api/client', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return mockAxiosInstance;
});

import { getLessonById, WLIMPLessonDetail } from '@/lib/api/programmes';
import apiClient from '@/lib/api/client';

describe('WLIMP Programme API Client', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLessonById', () => {
    it('should fetch lesson by ID and return lesson data', async () => {
      const mockLessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockLessonData: WLIMPLessonDetail = {
        id: mockLessonId,
        title: 'Introduction to Leadership',
        description: 'First lesson on leadership principles',
        content_type: 'video',
        content_url: 'https://youtube.com/watch?v=abc123',
        week_number: 1,
        week_title: 'Week 1: Foundations',
        programme_id: 1,
        programme_name: 'WLIMP - Workforce Leadership Programme',
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson fetched successfully',
          lesson: mockLessonData,
        },
      } as any);

      const result = await getLessonById(mockLessonId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/v1/api/lessons/${mockLessonId}`);
      expect(result).toEqual(mockLessonData);
      expect(result.id).toBe(mockLessonId);
      expect(result.title).toBe('Introduction to Leadership');
      expect(result.content_type).toBe('video');
      expect(result.week_number).toBe(1);
      expect(result.programme_name).toBe('WLIMP - Workforce Leadership Programme');
    });

    it('should handle different content types', async () => {
      const contentTypes = ['video', 'pdf', 'link'];
      
      for (const contentType of contentTypes) {
        const mockLessonData: WLIMPLessonDetail = {
          id: `lesson-${contentType}`,
          title: `${contentType} Lesson`,
          description: `A ${contentType} lesson`,
          content_type: contentType,
          content_url: `https://example.com/${contentType}`,
          week_number: 1,
          week_title: 'Week 1',
          programme_id: 1,
          programme_name: 'Test Programme',
        };

        mockApiClient.get.mockResolvedValue({
          data: {
            error: false,
            message: 'Lesson fetched successfully',
            lesson: mockLessonData,
          },
        } as any);

        const result = await getLessonById(`lesson-${contentType}`);
        expect(result.content_type).toBe(contentType);
      }
    });

    it('should throw error when lesson not found', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          error: true,
          message: 'Lesson not found',
          lesson: null,
        },
      } as any);

      await expect(getLessonById('non-existent-id')).rejects.toThrow('Lesson not found');
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(getLessonById('some-id')).rejects.toThrow('Network error');
    });

    it('should use correct endpoint URL', async () => {
      const lessonId = 'test-lesson-id';
      
      mockApiClient.get.mockResolvedValue({
        data: {
          error: false,
          message: 'Success',
          lesson: {
            id: lessonId,
            title: 'Test',
            description: 'Test',
            content_type: 'video',
            content_url: 'https://test.com',
            week_number: 1,
            week_title: 'Week 1',
            programme_id: 1,
            programme_name: 'Test',
          },
        },
      } as any);

      await getLessonById(lessonId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/v1/api/lessons/${lessonId}`);
    });
  });
});
