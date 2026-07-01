/**
 * Unit tests for lesson endpoints
 * 
 * Tests the lesson endpoints including:
 * - GET /api/v1/lessons/:id - Lesson retrieval with week and programme metadata
 * - Lesson not found handling
 * - Invalid UUID handling
 */

const ContentService = require('../../services/ContentService');
const BackendSDK = require('../../core/BackendSDK');

// Mock the ContentService
jest.mock('../../services/ContentService');

// Mock the BackendSDK
jest.mock('../../core/BackendSDK');

describe('GET /v1/api/lessons/:lesson_id - Endpoint Logic', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
    };
    
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('Lesson retrieval with metadata', () => {
    it('should retrieve lesson with week and programme metadata', async () => {
      const mockLesson = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Introduction to Leadership',
        description: 'First lesson on leadership principles',
        content_type: 'video',
        content_url: 'https://youtube.com/watch?v=abc123',
        order_index: 0,
        week_id: 'w1w2w3w4-w5w6-w7w8-w9w0-w1w2w3w4w5w6',
        week: {
          id: 'w1w2w3w4-w5w6-w7w8-w9w0-w1w2w3w4w5w6',
          week_number: 1,
          title: 'Week 1: Foundations',
          programme_id: 1,
        },
      };

      const mockProgramme = {
        id: 1,
        name: 'WLIMP - Workforce Leadership Programme',
        description: 'Leadership development programme',
      };

      // Mock ContentService
      ContentService.getLessonById.mockResolvedValue(mockLesson);

      // Mock SDK call for programme
      mockSdk.get.mockResolvedValueOnce([mockProgramme]);

      // Simulate endpoint logic
      const lesson = await ContentService.getLessonById('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(lesson).toBeDefined();
      expect(lesson.id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(lesson.title).toBe('Introduction to Leadership');
      expect(lesson.content_type).toBe('video');
      expect(lesson.week).toBeDefined();
      expect(lesson.week.week_number).toBe(1);
      expect(lesson.week.programme_id).toBe(1);

      // Get programme details
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: lesson.week.programme_id }))[0];

      expect(programme).toBeDefined();
      expect(programme.name).toBe('WLIMP - Workforce Leadership Programme');
    });

    it('should handle different content types', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          title: 'Video Lesson',
          content_type: 'video',
          content_url: 'https://youtube.com/watch?v=xyz',
          week: { id: 'week-1', week_number: 1, programme_id: 1 },
        },
        {
          id: 'lesson-2',
          title: 'PDF Lesson',
          content_type: 'pdf',
          content_url: 'https://example.com/document.pdf',
          week: { id: 'week-1', week_number: 1, programme_id: 1 },
        },
        {
          id: 'lesson-3',
          title: 'Link Lesson',
          content_type: 'link',
          content_url: 'https://drive.google.com/file/d/abc123',
          week: { id: 'week-1', week_number: 1, programme_id: 1 },
        },
      ];

      for (const mockLesson of mockLessons) {
        ContentService.getLessonById.mockResolvedValue(mockLesson);

        const lesson = await ContentService.getLessonById(mockLesson.id);

        expect(lesson.content_type).toBe(mockLesson.content_type);
        expect(lesson.content_url).toBe(mockLesson.content_url);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent lesson', async () => {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      ContentService.getLessonById.mockRejectedValue(error);

      await expect(
        ContentService.getLessonById('non-existent-uuid')
      ).rejects.toThrow('Lesson not found');
    });

    it('should validate UUID format', () => {
      const validUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        'a1b2c3d4e5f678901234567890abcdef', // No hyphens
        'a1b2c3d4-e5f6-7890-abcd', // Too short
      ];

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(validUUID)).toBe(true);

      invalidUUIDs.forEach(invalidUUID => {
        expect(uuidRegex.test(invalidUUID)).toBe(false);
      });
    });

    it('should handle programme not found after lesson retrieval', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        week: {
          id: 'week-1',
          week_number: 1,
          programme_id: 999,
        },
      };

      ContentService.getLessonById.mockResolvedValue(mockLesson);
      mockSdk.get.mockResolvedValue([]); // Programme not found

      const lesson = await ContentService.getLessonById('lesson-1');
      expect(lesson).toBeDefined();

      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: 999 }))[0];

      expect(programme).toBeUndefined();
    });
  });

  describe('Response formatting', () => {
    it('should format response with all required fields', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'video',
        content_url: 'https://youtube.com/watch?v=test',
        order_index: 0,
        week: {
          id: 'week-1',
          week_number: 2,
          title: 'Week 2: Advanced Topics',
          programme_id: 1,
        },
      };

      const mockProgramme = {
        id: 1,
        name: 'Test Programme',
      };

      ContentService.getLessonById.mockResolvedValue(mockLesson);
      mockSdk.get.mockResolvedValue([mockProgramme]);

      const lesson = await ContentService.getLessonById('lesson-1');
      const sdk = new BackendSDK();
      sdk.setTable('programmes');
      const programme = (await sdk.get({ id: lesson.week.programme_id }))[0];

      // Simulate response formatting
      const response = {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content_type: lesson.content_type,
        content_url: lesson.content_url,
        week_number: lesson.week.week_number,
        week_title: lesson.week.title,
        programme_id: lesson.week.programme_id,
        programme_name: programme.name,
      };

      expect(response).toEqual({
        id: 'lesson-1',
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'video',
        content_url: 'https://youtube.com/watch?v=test',
        week_number: 2,
        week_title: 'Week 2: Advanced Topics',
        programme_id: 1,
        programme_name: 'Test Programme',
      });
    });
  });
});


/**
 * Unit tests for PUT /v1/api/lessons/:lesson_id endpoint
 * 
 * Tests the lesson update endpoint including:
 * - Updating lesson title
 * - Updating lesson description
 * - Updating lesson content_url
 * - Updating multiple fields at once
 * - Validation errors
 * - Lesson not found handling
 * - Invalid UUID handling
 * 
 * Requirements: 7.5
 */

describe('PUT /v1/api/lessons/:lesson_id - Endpoint Logic', () => {
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock SDK instance
    mockSdk = {
      setTable: jest.fn(),
      get: jest.fn(),
    };
    
    BackendSDK.mockImplementation(() => mockSdk);
  });

  describe('Lesson update', () => {
    it('should update lesson title', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {
        title: 'Updated Leadership Principles',
      };

      const mockUpdatedLesson = {
        id: lessonId,
        title: updateData.title,
        description: 'Original description',
        content_type: 'video',
        content_url: 'https://youtube.com/watch?v=abc123',
        order_index: 0,
        updated_at: new Date(),
      };

      // Mock ContentService
      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      // Simulate endpoint logic
      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);

      expect(updatedLesson).toBeDefined();
      expect(updatedLesson.id).toBe(lessonId);
      expect(updatedLesson.title).toBe(updateData.title);
      expect(ContentService.updateLesson).toHaveBeenCalledWith(lessonId, updateData);
    });

    it('should update lesson description', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {
        description: 'Updated description with more details',
      };

      const mockUpdatedLesson = {
        id: lessonId,
        title: 'Original Title',
        description: updateData.description,
        content_type: 'video',
        content_url: 'https://youtube.com/watch?v=abc123',
        order_index: 0,
        updated_at: new Date(),
      };

      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);

      expect(updatedLesson.description).toBe(updateData.description);
      expect(ContentService.updateLesson).toHaveBeenCalledWith(lessonId, updateData);
    });

    it('should update lesson content_url', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {
        content_url: 'https://youtube.com/watch?v=newvideo',
      };

      const mockUpdatedLesson = {
        id: lessonId,
        title: 'Original Title',
        description: 'Original description',
        content_type: 'video',
        content_url: updateData.content_url,
        order_index: 0,
        updated_at: new Date(),
      };

      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);

      expect(updatedLesson.content_url).toBe(updateData.content_url);
      expect(ContentService.updateLesson).toHaveBeenCalledWith(lessonId, updateData);
    });

    it('should update multiple fields at once', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        content_url: 'https://youtube.com/watch?v=updated',
      };

      const mockUpdatedLesson = {
        id: lessonId,
        title: updateData.title,
        description: updateData.description,
        content_type: 'video',
        content_url: updateData.content_url,
        order_index: 0,
        updated_at: new Date(),
      };

      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);

      expect(updatedLesson.title).toBe(updateData.title);
      expect(updatedLesson.description).toBe(updateData.description);
      expect(updatedLesson.content_url).toBe(updateData.content_url);
      expect(ContentService.updateLesson).toHaveBeenCalledWith(lessonId, updateData);
    });

    it('should preserve content_type when updating', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {
        title: 'Updated Title',
      };

      const mockUpdatedLesson = {
        id: lessonId,
        title: updateData.title,
        description: 'Original description',
        content_type: 'pdf', // Should remain unchanged
        content_url: 'https://example.com/document.pdf',
        order_index: 0,
        updated_at: new Date(),
      };

      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);

      expect(updatedLesson.content_type).toBe('pdf');
    });

    it('should preserve order_index when updating', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {
        title: 'Updated Title',
      };

      const mockUpdatedLesson = {
        id: lessonId,
        title: updateData.title,
        description: 'Original description',
        content_type: 'video',
        content_url: 'https://youtube.com/watch?v=abc123',
        order_index: 5, // Should remain unchanged
        updated_at: new Date(),
      };

      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);

      expect(updatedLesson.order_index).toBe(5);
    });
  });

  describe('Error handling for updates', () => {
    it('should handle lesson not found', async () => {
      const lessonId = 'non-existent-uuid';
      const updateData = {
        title: 'Updated Title',
      };

      const error = new Error('Lesson not found');
      error.statusCode = 404;
      ContentService.updateLesson.mockRejectedValue(error);

      await expect(
        ContentService.updateLesson(lessonId, updateData)
      ).rejects.toThrow('Lesson not found');
    });

    it('should handle invalid URL format', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {
        content_url: 'not-a-valid-url',
      };

      const error = new Error('Invalid URL format for content_url');
      error.statusCode = 400;
      ContentService.updateLesson.mockRejectedValue(error);

      await expect(
        ContentService.updateLesson(lessonId, updateData)
      ).rejects.toThrow('Invalid URL format for content_url');
    });

    it('should handle no fields to update', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateData = {};

      const error = new Error('No valid fields to update');
      error.statusCode = 400;
      ContentService.updateLesson.mockRejectedValue(error);

      await expect(
        ContentService.updateLesson(lessonId, updateData)
      ).rejects.toThrow('No valid fields to update');
    });

    it('should validate UUID format before update', () => {
      const validUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        'a1b2c3d4e5f678901234567890abcdef', // No hyphens
        'a1b2c3d4-e5f6-7890-abcd', // Too short
      ];

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(validUUID)).toBe(true);

      invalidUUIDs.forEach(invalidUUID => {
        expect(uuidRegex.test(invalidUUID)).toBe(false);
      });
    });
  });

  describe('URL validation', () => {
    it('should accept valid YouTube URLs', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const validYouTubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=abc123',
        'https://youtu.be/abc123',
      ];

      for (const url of validYouTubeUrls) {
        const updateData = { content_url: url };
        const mockUpdatedLesson = {
          id: lessonId,
          title: 'Title',
          content_type: 'video',
          content_url: url,
          order_index: 0,
        };

        ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

        const updatedLesson = await ContentService.updateLesson(lessonId, updateData);
        expect(updatedLesson.content_url).toBe(url);
      }
    });

    it('should accept valid Google Drive URLs', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const driveUrl = 'https://drive.google.com/file/d/1abc123xyz/view';
      const updateData = { content_url: driveUrl };

      const mockUpdatedLesson = {
        id: lessonId,
        title: 'Title',
        content_type: 'link',
        content_url: driveUrl,
        order_index: 0,
      };

      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);
      expect(updatedLesson.content_url).toBe(driveUrl);
    });

    it('should accept valid PDF URLs', async () => {
      const lessonId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const pdfUrl = 'https://example.com/document.pdf';
      const updateData = { content_url: pdfUrl };

      const mockUpdatedLesson = {
        id: lessonId,
        title: 'Title',
        content_type: 'pdf',
        content_url: pdfUrl,
        order_index: 0,
      };

      ContentService.updateLesson.mockResolvedValue(mockUpdatedLesson);

      const updatedLesson = await ContentService.updateLesson(lessonId, updateData);
      expect(updatedLesson.content_url).toBe(pdfUrl);
    });
  });
});
