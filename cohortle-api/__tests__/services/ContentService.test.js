/**
 * ContentService Unit Tests
 * 
 * Tests for week and lesson creation validation
 * Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.8
 */

const ContentService = require('../../services/ContentService');
const db = require('../../models');

// Mock the database models
jest.mock('../../models', () => ({
  weeks: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  lessons: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe('ContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWeek', () => {
    const validWeekData = {
      week_number: 1,
      title: 'Introduction to Leadership',
      start_date: '2026-01-01',
    };

    it('should create a week with valid data', async () => {
      const programmeId = 1;
      const mockCreatedWeek = {
        id: 'week-uuid-1',
        programme_id: programmeId,
        week_number: validWeekData.week_number,
        title: validWeekData.title,
        start_date: new Date(validWeekData.start_date),
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.weeks.findOne.mockResolvedValue(null); // No existing week
      db.weeks.create.mockResolvedValue(mockCreatedWeek);

      const result = await ContentService.createWeek(programmeId, validWeekData);

      expect(result).toEqual(mockCreatedWeek);
      expect(db.weeks.findOne).toHaveBeenCalledWith({
        where: {
          programme_id: programmeId,
          week_number: validWeekData.week_number,
        },
      });
      expect(db.weeks.create).toHaveBeenCalledWith({
        programme_id: programmeId,
        week_number: validWeekData.week_number,
        title: validWeekData.title,
        start_date: validWeekData.start_date,
      });
    });

    it('should reject missing week_number', async () => {
      const programmeId = 1;
      const invalidData = {
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Missing required fields: week_number, title, start_date');
    });

    it('should reject missing title', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 1,
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Missing required fields: week_number, title, start_date');
    });

    it('should reject missing start_date', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 1,
        title: 'Introduction to Leadership',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Missing required fields: week_number, title, start_date');
    });

    it('should reject week_number less than 1', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 0,
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Week number must be an integer >= 1');
    });

    it('should reject negative week_number', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: -1,
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Week number must be an integer >= 1');
    });

    it('should reject non-integer week_number', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 1.5,
        title: 'Introduction to Leadership',
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Week number must be an integer >= 1');
    });

    it('should reject title shorter than 3 characters', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 1,
        title: 'AB',
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Title must be between 3 and 200 characters');
    });

    it('should reject title longer than 200 characters', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 1,
        title: 'A'.repeat(201),
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Title must be between 3 and 200 characters');
    });

    it('should reject title with only whitespace', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 1,
        title: '   ',
        start_date: '2026-01-01',
      };

      await expect(ContentService.createWeek(programmeId, invalidData))
        .rejects
        .toThrow('Title must be between 3 and 200 characters');
    });

    it('should accept title with exactly 3 characters', async () => {
      const programmeId = 1;
      const validData = {
        week_number: 1,
        title: 'ABC',
        start_date: '2026-01-01',
      };

      const mockCreatedWeek = {
        id: 'week-uuid-1',
        programme_id: programmeId,
        week_number: validData.week_number,
        title: validData.title,
        start_date: new Date(validData.start_date),
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.weeks.findOne.mockResolvedValue(null);
      db.weeks.create.mockResolvedValue(mockCreatedWeek);

      const result = await ContentService.createWeek(programmeId, validData);

      expect(result).toEqual(mockCreatedWeek);
    });

    it('should accept title with exactly 200 characters', async () => {
      const programmeId = 1;
      const validData = {
        week_number: 1,
        title: 'A'.repeat(200),
        start_date: '2026-01-01',
      };

      const mockCreatedWeek = {
        id: 'week-uuid-1',
        programme_id: programmeId,
        week_number: validData.week_number,
        title: validData.title,
        start_date: new Date(validData.start_date),
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.weeks.findOne.mockResolvedValue(null);
      db.weeks.create.mockResolvedValue(mockCreatedWeek);

      const result = await ContentService.createWeek(programmeId, validData);

      expect(result).toEqual(mockCreatedWeek);
    });

    it('should reject duplicate week_number for same programme', async () => {
      const programmeId = 1;
      const existingWeek = {
        id: 'existing-week-uuid',
        programme_id: programmeId,
        week_number: 1,
        title: 'Existing Week',
      };

      db.weeks.findOne.mockResolvedValue(existingWeek);

      await expect(ContentService.createWeek(programmeId, validWeekData))
        .rejects
        .toThrow('Week number already exists for this programme');
    });

    it('should return complete week object with all fields', async () => {
      const programmeId = 1;
      const mockCreatedWeek = {
        id: 'week-uuid-1',
        programme_id: programmeId,
        week_number: validWeekData.week_number,
        title: validWeekData.title,
        start_date: new Date(validWeekData.start_date),
        created_at: new Date('2026-01-01T10:00:00Z'),
        updated_at: new Date('2026-01-01T10:00:00Z'),
      };

      db.weeks.findOne.mockResolvedValue(null);
      db.weeks.create.mockResolvedValue(mockCreatedWeek);

      const result = await ContentService.createWeek(programmeId, validWeekData);

      // Verify all required fields are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('programme_id');
      expect(result).toHaveProperty('week_number');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('start_date');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
    });

    it('should throw error with statusCode 400 for validation failures', async () => {
      const programmeId = 1;
      const invalidData = {
        week_number: 1,
        title: 'AB', // Too short
        start_date: '2026-01-01',
      };

      try {
        await ContentService.createWeek(programmeId, invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Title must be between 3 and 200 characters');
      }
    });

    it('should throw error with statusCode 409 for duplicate week_number', async () => {
      const programmeId = 1;
      const existingWeek = {
        id: 'existing-week-uuid',
        programme_id: programmeId,
        week_number: 1,
      };

      db.weeks.findOne.mockResolvedValue(existingWeek);

      try {
        await ContentService.createWeek(programmeId, validWeekData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Week number already exists for this programme');
      }
    });
  });
});

  describe('createLesson', () => {
    const validLessonData = {
      title: 'Introduction to Leadership',
      description: 'Learn the basics of leadership',
      content_type: 'video',
      content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      order_index: 0,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a lesson with valid video data', async () => {
      const weekId = 'week-uuid-1';
      const mockCreatedLesson = {
        id: 'lesson-uuid-1',
        week_id: weekId,
        title: validLessonData.title,
        description: validLessonData.description,
        content_type: validLessonData.content_type,
        content_url: validLessonData.content_url,
        order_index: validLessonData.order_index,
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.lessons.create.mockResolvedValue(mockCreatedLesson);

      const result = await ContentService.createLesson(weekId, validLessonData);

      expect(result).toEqual(mockCreatedLesson);
      expect(db.lessons.create).toHaveBeenCalledWith({
        week_id: weekId,
        title: validLessonData.title,
        description: validLessonData.description,
        content_type: validLessonData.content_type,
        content_url: validLessonData.content_url,
        order_index: validLessonData.order_index,
      });
    });

    it('should create a lesson with PDF content type', async () => {
      const weekId = 'week-uuid-1';
      const pdfLessonData = {
        title: 'Leadership Guide',
        description: 'PDF guide',
        content_type: 'pdf',
        content_url: 'https://example.com/document.pdf',
        order_index: 0,
      };

      const mockCreatedLesson = {
        id: 'lesson-uuid-2',
        week_id: weekId,
        ...pdfLessonData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.lessons.create.mockResolvedValue(mockCreatedLesson);

      const result = await ContentService.createLesson(weekId, pdfLessonData);

      expect(result).toEqual(mockCreatedLesson);
    });

    it('should create a lesson with link content type', async () => {
      const weekId = 'week-uuid-1';
      const linkLessonData = {
        title: 'External Article',
        description: 'Read this article',
        content_type: 'link',
        content_url: 'https://example.com/article',
        order_index: 0,
      };

      const mockCreatedLesson = {
        id: 'lesson-uuid-3',
        week_id: weekId,
        ...linkLessonData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.lessons.create.mockResolvedValue(mockCreatedLesson);

      const result = await ContentService.createLesson(weekId, linkLessonData);

      expect(result).toEqual(mockCreatedLesson);
    });

    it('should create a lesson with text content type', async () => {
      const weekId = 'week-uuid-1';
      const textLessonData = {
        title: 'Text Lesson',
        description: 'Plain text content',
        content_type: 'text',
        content_url: 'This is the lesson text content.',
        order_index: 0,
      };

      const mockCreatedLesson = {
        id: 'lesson-uuid-4',
        week_id: weekId,
        ...textLessonData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.lessons.create.mockResolvedValue(mockCreatedLesson);

      const result = await ContentService.createLesson(weekId, textLessonData);

      expect(result).toEqual(mockCreatedLesson);
    });

    it('should reject missing title', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        description: 'Test description',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=test',
        order_index: 0,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Missing required fields: title, content_type, content_url, order_index');
    });

    it('should reject missing content_type', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_url: 'https://www.youtube.com/watch?v=test',
        order_index: 0,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Missing required fields: title, content_type, content_url, order_index');
    });

    it('should reject missing content_url', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'video',
        order_index: 0,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Missing required fields: title, content_type, content_url, order_index');
    });

    it('should reject missing order_index', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=test',
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Missing required fields: title, content_type, content_url, order_index');
    });

    it('should reject invalid content_type', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'invalid_type',
        content_url: 'https://example.com',
        order_index: 0,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Invalid content_type. Must be one of: video, link, pdf, text');
    });

    it('should reject negative order_index', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=test',
        order_index: -1,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Order index must be non-negative');
    });

    it('should reject invalid URL format for video content', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'video',
        content_url: 'not-a-valid-url',
        order_index: 0,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Invalid URL format for content_url');
    });

    it('should reject invalid URL format for PDF content', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'pdf',
        content_url: 'not-a-valid-url',
        order_index: 0,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Invalid URL format for content_url');
    });

    it('should reject invalid URL format for link content', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'link',
        content_url: 'not-a-valid-url',
        order_index: 0,
      };

      await expect(ContentService.createLesson(weekId, invalidData))
        .rejects
        .toThrow('Invalid URL format for content_url');
    });

    it('should accept text content without URL validation', async () => {
      const weekId = 'week-uuid-1';
      const textLessonData = {
        title: 'Text Lesson',
        description: 'Plain text',
        content_type: 'text',
        content_url: 'This is plain text, not a URL',
        order_index: 0,
      };

      const mockCreatedLesson = {
        id: 'lesson-uuid-5',
        week_id: weekId,
        ...textLessonData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.lessons.create.mockResolvedValue(mockCreatedLesson);

      const result = await ContentService.createLesson(weekId, textLessonData);

      expect(result).toEqual(mockCreatedLesson);
    });

    it('should return complete lesson object with all fields', async () => {
      const weekId = 'week-uuid-1';
      const mockCreatedLesson = {
        id: 'lesson-uuid-1',
        week_id: weekId,
        title: validLessonData.title,
        description: validLessonData.description,
        content_type: validLessonData.content_type,
        content_url: validLessonData.content_url,
        order_index: validLessonData.order_index,
        created_at: new Date('2026-01-01T10:00:00Z'),
        updated_at: new Date('2026-01-01T10:00:00Z'),
      };

      db.lessons.create.mockResolvedValue(mockCreatedLesson);

      const result = await ContentService.createLesson(weekId, validLessonData);

      // Verify all required fields are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('week_id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('content_type');
      expect(result).toHaveProperty('content_url');
      expect(result).toHaveProperty('order_index');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
    });

    it('should throw error with statusCode 400 for validation failures', async () => {
      const weekId = 'week-uuid-1';
      const invalidData = {
        title: 'Test Lesson',
        description: 'Test description',
        content_type: 'invalid_type',
        content_url: 'https://example.com',
        order_index: 0,
      };

      try {
        await ContentService.createLesson(weekId, invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Invalid content_type');
      }
    });
  });

