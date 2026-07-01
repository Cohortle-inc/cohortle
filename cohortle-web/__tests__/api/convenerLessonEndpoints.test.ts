/**
 * Unit Tests: Convener Lesson Management API Functions
 * Feature: convener-dashboard
 * Tests API client functions for lesson management
 * **Validates: Requirements 5.6, 5.7, 6.3**
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
  createLesson,
  updateLesson,
  reorderLessons,
  Lesson,
  LessonFormData,
} from '@/lib/api/convener';
import apiClient from '@/lib/api/client';

describe('Convener Lesson Management API', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLesson', () => {
    it('should create a video lesson and return lesson data', async () => {
      const weekId = 'week-uuid-1';
      const lessonFormData: LessonFormData = {
        title: 'Introduction to TypeScript',
        description: 'Learn the basics of TypeScript',
        contentType: 'video',
        contentUrl: 'https://youtube.com/watch?v=abc123',
        orderIndex: 0,
      };

      const mockLessonData: Lesson = {
        id: 'lesson-uuid-1',
        weekId: 'week-uuid-1',
        title: 'Introduction to TypeScript',
        description: 'Learn the basics of TypeScript',
        contentType: 'video',
        contentUrl: 'https://youtube.com/watch?v=abc123',
        orderIndex: 0,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson created successfully',
          lesson: mockLessonData,
        },
      } as any);

      const result = await createLesson(weekId, lessonFormData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/v1/api/weeks/${weekId}/lessons`,
        expect.objectContaining({
          title: lessonFormData.title,
          content_type: lessonFormData.contentType,
        })
      );
      expect(result).toEqual(mockLessonData);
      expect(result.contentType).toBe('video');
      expect(result.title).toBe('Introduction to TypeScript');
    });

    it('should create a PDF lesson', async () => {
      const weekId = 'week-uuid-1';
      const lessonFormData: LessonFormData = {
        title: 'Course Materials',
        description: 'Download the course PDF',
        contentType: 'pdf',
        contentUrl: 'https://example.com/course.pdf',
        orderIndex: 1,
      };

      const mockLessonData: Lesson = {
        id: 'lesson-uuid-2',
        weekId: 'week-uuid-1',
        title: 'Course Materials',
        description: 'Download the course PDF',
        contentType: 'pdf',
        contentUrl: 'https://example.com/course.pdf',
        orderIndex: 1,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson created successfully',
          lesson: mockLessonData,
        },
      } as any);

      const result = await createLesson(weekId, lessonFormData);

      expect(result.contentType).toBe('pdf');
      expect(result.contentUrl).toContain('.pdf');
    });

    it('should create a link lesson', async () => {
      const weekId = 'week-uuid-1';
      const lessonFormData: LessonFormData = {
        title: 'External Resource',
        description: 'Visit this helpful website',
        contentType: 'link',
        contentUrl: 'https://example.com/resource',
        orderIndex: 2,
      };

      const mockLessonData: Lesson = {
        id: 'lesson-uuid-3',
        weekId: 'week-uuid-1',
        title: 'External Resource',
        description: 'Visit this helpful website',
        contentType: 'link',
        contentUrl: 'https://example.com/resource',
        orderIndex: 2,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson created successfully',
          lesson: mockLessonData,
        },
      } as any);

      const result = await createLesson(weekId, lessonFormData);

      expect(result.contentType).toBe('link');
    });

    it('should create a text lesson', async () => {
      const weekId = 'week-uuid-1';
      const lessonFormData: LessonFormData = {
        title: 'Reading Material',
        description: 'Important concepts to understand',
        contentType: 'text',
        contentUrl: '',
        contentText: 'This is the lesson content in text format.',
        orderIndex: 3,
      };

      const mockLessonData: Lesson = {
        id: 'lesson-uuid-4',
        weekId: 'week-uuid-1',
        title: 'Reading Material',
        description: 'Important concepts to understand',
        contentType: 'text',
        contentUrl: '',
        orderIndex: 3,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson created successfully',
          lesson: mockLessonData,
        },
      } as any);

      const result = await createLesson(weekId, lessonFormData);

      expect(result.contentType).toBe('text');
    });

    it('should throw error when lesson creation fails', async () => {
      const weekId = 'week-uuid-1';
      const lessonFormData: LessonFormData = {
        title: 'Test Lesson',
        description: 'Test',
        contentType: 'video',
        contentUrl: 'invalid-url',
        orderIndex: 0,
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: true,
          message: 'Invalid content URL',
          data: null,
        },
      } as any);

      await expect(createLesson(weekId, lessonFormData)).rejects.toThrow(
        'Invalid content URL'
      );
    });

    it('should throw error on network failure', async () => {
      const weekId = 'week-uuid-1';
      const lessonFormData: LessonFormData = {
        title: 'Test Lesson',
        description: 'Test',
        contentType: 'video',
        contentUrl: 'https://example.com/video',
        orderIndex: 0,
      };

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(createLesson(weekId, lessonFormData)).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle lesson with long title and description', async () => {
      const weekId = 'week-uuid-1';
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(1000);
      const lessonFormData: LessonFormData = {
        title: longTitle,
        description: longDescription,
        contentType: 'video',
        contentUrl: 'https://example.com/video',
        orderIndex: 0,
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          error: false,
          message: 'Success',
          lesson: {
            id: 'lesson-uuid-1',
            weekId: 'week-uuid-1',
            title: longTitle,
            description: longDescription,
            contentType: 'video',
            contentUrl: 'https://example.com/video',
            orderIndex: 0,
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
          },
        },
      } as any);

      const result = await createLesson(weekId, lessonFormData);

      expect(result.title.length).toBe(200);
      expect(result.description.length).toBe(1000);
    });
  });

  describe('updateLesson', () => {
    it('should update lesson title and description', async () => {
      const lessonId = 'lesson-uuid-1';
      const updateData: Partial<LessonFormData> = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const mockUpdatedLesson: Lesson = {
        id: 'lesson-uuid-1',
        weekId: 'week-uuid-1',
        title: 'Updated Title',
        description: 'Updated description',
        contentType: 'video',
        contentUrl: 'https://example.com/video',
        orderIndex: 0,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      };

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson updated successfully',
          lesson: mockUpdatedLesson,
        },
      } as any);

      const result = await updateLesson(lessonId, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/v1/api/lessons/${lessonId}`,
        expect.objectContaining({
          title: updateData.title,
          description: updateData.description
        })
      );
      expect(result).toEqual(mockUpdatedLesson);
      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated description');
    });

    it('should update lesson content URL', async () => {
      const lessonId = 'lesson-uuid-1';
      const updateData: Partial<LessonFormData> = {
        contentUrl: 'https://example.com/new-video',
      };

      const mockUpdatedLesson: Lesson = {
        id: 'lesson-uuid-1',
        weekId: 'week-uuid-1',
        title: 'Original Title',
        description: 'Original description',
        contentType: 'video',
        contentUrl: 'https://example.com/new-video',
        orderIndex: 0,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      };

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson updated successfully',
          lesson: mockUpdatedLesson,
        },
      } as any);

      const result = await updateLesson(lessonId, updateData);

      expect(result.contentUrl).toBe('https://example.com/new-video');
    });

    it('should update lesson content type', async () => {
      const lessonId = 'lesson-uuid-1';
      const updateData: Partial<LessonFormData> = {
        contentType: 'pdf',
        contentUrl: 'https://example.com/document.pdf',
      };

      const mockUpdatedLesson: Lesson = {
        id: 'lesson-uuid-1',
        weekId: 'week-uuid-1',
        title: 'Original Title',
        description: 'Original description',
        contentType: 'pdf',
        contentUrl: 'https://example.com/document.pdf',
        orderIndex: 0,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      };

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson updated successfully',
          lesson: mockUpdatedLesson,
        },
      } as any);

      const result = await updateLesson(lessonId, updateData);

      expect(result.contentType).toBe('pdf');
      expect(result.contentUrl).toContain('.pdf');
    });

    it('should throw error when lesson update fails', async () => {
      const lessonId = 'lesson-uuid-1';
      const updateData: Partial<LessonFormData> = {
        title: 'Updated Title',
      };

      mockApiClient.put.mockResolvedValue({
        data: {
          error: true,
          message: 'Lesson not found',
          data: null,
        },
      } as any);

      await expect(updateLesson(lessonId, updateData)).rejects.toThrow(
        'Lesson not found'
      );
    });

    it('should throw error on network failure', async () => {
      const lessonId = 'lesson-uuid-1';
      const updateData: Partial<LessonFormData> = {
        title: 'Updated Title',
      };

      mockApiClient.put.mockRejectedValue(new Error('Network error'));

      await expect(updateLesson(lessonId, updateData)).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle partial updates', async () => {
      const lessonId = 'lesson-uuid-1';
      const updateData: Partial<LessonFormData> = {
        orderIndex: 5,
      };

      const mockUpdatedLesson: Lesson = {
        id: 'lesson-uuid-1',
        weekId: 'week-uuid-1',
        title: 'Original Title',
        description: 'Original description',
        contentType: 'video',
        contentUrl: 'https://example.com/video',
        orderIndex: 5,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      };

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Lesson updated successfully',
          lesson: mockUpdatedLesson,
        },
      } as any);

      const result = await updateLesson(lessonId, updateData);

      expect(result.orderIndex).toBe(5);
      expect(result.title).toBe('Original Title');
    });
  });

  describe('reorderLessons', () => {
    it('should reorder lessons and return updated lessons array', async () => {
      const weekId = 'week-uuid-1';
      const lessonIds = ['lesson-3', 'lesson-1', 'lesson-2'];

      const mockReorderedLessons: Lesson[] = [
        {
          id: 'lesson-3',
          weekId: 'week-uuid-1',
          title: 'Lesson 3',
          description: 'Third lesson',
          contentType: 'video',
          contentUrl: 'https://example.com/video3',
          orderIndex: 0,
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T12:00:00Z',
        },
        {
          id: 'lesson-1',
          weekId: 'week-uuid-1',
          title: 'Lesson 1',
          description: 'First lesson',
          contentType: 'video',
          contentUrl: 'https://example.com/video1',
          orderIndex: 1,
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T12:00:00Z',
        },
        {
          id: 'lesson-2',
          weekId: 'week-uuid-1',
          title: 'Lesson 2',
          description: 'Second lesson',
          contentType: 'pdf',
          contentUrl: 'https://example.com/doc.pdf',
          orderIndex: 2,
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T12:00:00Z',
        },
      ];

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Lessons reordered successfully',
          lessons: mockReorderedLessons,
        },
      } as any);

      const result = await reorderLessons(weekId, lessonIds);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/v1/api/weeks/${weekId}/lessons/reorder`,
        { lesson_ids: lessonIds }
      );
      expect(result).toEqual(mockReorderedLessons);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('lesson-3');
      expect(result[0].orderIndex).toBe(0);
      expect(result[1].id).toBe('lesson-1');
      expect(result[1].orderIndex).toBe(1);
      expect(result[2].id).toBe('lesson-2');
      expect(result[2].orderIndex).toBe(2);
    });

    it('should handle reordering with single lesson', async () => {
      const weekId = 'week-uuid-1';
      const lessonIds = ['lesson-1'];

      const mockReorderedLessons: Lesson[] = [
        {
          id: 'lesson-1',
          weekId: 'week-uuid-1',
          title: 'Lesson 1',
          description: 'First lesson',
          contentType: 'video',
          contentUrl: 'https://example.com/video1',
          orderIndex: 0,
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T12:00:00Z',
        },
      ];

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Lessons reordered successfully',
          lessons: mockReorderedLessons,
        },
      } as any);

      const result = await reorderLessons(weekId, lessonIds);

      expect(result).toHaveLength(1);
      expect(result[0].orderIndex).toBe(0);
    });

    it('should handle reordering with many lessons', async () => {
      const weekId = 'week-uuid-1';
      const lessonIds = Array.from({ length: 10 }, (_, i) => `lesson-${i + 1}`);

      const mockReorderedLessons: Lesson[] = lessonIds.map((id, index) => ({
        id,
        weekId: 'week-uuid-1',
        title: `Lesson ${index + 1}`,
        description: `Description ${index + 1}`,
        contentType: 'video' as const,
        contentUrl: `https://example.com/video${index + 1}`,
        orderIndex: index,
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T12:00:00Z',
      }));

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Lessons reordered successfully',
          lessons: mockReorderedLessons,
        },
      } as any);

      const result = await reorderLessons(weekId, lessonIds);

      expect(result).toHaveLength(10);
      expect(result[0].orderIndex).toBe(0);
      expect(result[9].orderIndex).toBe(9);
    });

    it('should throw error when reorder fails', async () => {
      const weekId = 'week-uuid-1';
      const lessonIds = ['lesson-1', 'lesson-2'];

      mockApiClient.put.mockResolvedValue({
        data: {
          error: true,
          message: 'Invalid lesson IDs',
          data: null,
        },
      } as any);

      await expect(reorderLessons(weekId, lessonIds)).rejects.toThrow(
        'Invalid lesson IDs'
      );
    });

    it('should throw error on network failure', async () => {
      const weekId = 'week-uuid-1';
      const lessonIds = ['lesson-1', 'lesson-2'];

      mockApiClient.put.mockRejectedValue(new Error('Network error'));

      await expect(reorderLessons(weekId, lessonIds)).rejects.toThrow(
        'Network error'
      );
    });

    it('should use correct endpoint URL', async () => {
      const weekId = 'week-uuid-42';
      const lessonIds = ['lesson-1', 'lesson-2'];

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'Success',
          lessons: [],
        },
      } as any);

      await reorderLessons(weekId, lessonIds);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/v1/api/weeks/week-uuid-42/lessons/reorder',
        { lesson_ids: lessonIds }
      );
    });

    it('should handle empty lesson array', async () => {
      const weekId = 'week-uuid-1';
      const lessonIds: string[] = [];

      mockApiClient.put.mockResolvedValue({
        data: {
          error: false,
          message: 'No lessons to reorder',
          data: [],
        },
      } as any);

      const result = await reorderLessons(weekId, lessonIds);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
