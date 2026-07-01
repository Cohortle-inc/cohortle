/**
 * ContentService
 * 
 * Handles weeks and lessons management for WLIMP programmes.
 * Provides methods to create, retrieve, and manage programme content.
 * 
 * Requirements: 1.3, 1.4, 1.5, 1.6, 7.3, 7.4, 7.5
 */

const db = require('../models');
const { weeks, lessons } = db;

class ContentService {
  /**
   * Get all lessons for a specific week
   * 
   * @param {string} weekId - Week UUID
   * @returns {Promise<Array>} - Array of lesson objects ordered by order_index
   * 
   * Requirements: 1.4
   */
  async getWeekLessons(weekId) {
    const weekLessons = await lessons.findAll({
      where: { week_id: weekId },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'description', 'content_type', 'content_url', 'content_text', 'order_index', 'created_at', 'updated_at'],
    });

    return weekLessons;
  }

  /**
   * Get a lesson by ID with week and programme metadata
   * 
   * @param {string} lessonId - Lesson UUID
   * @returns {Promise<Object>} - Lesson object with week and programme data
   * @throws {Error} - If lesson not found
   * 
   * Requirements: 1.4
   */
  async getLessonById(lessonId) {
    const lesson = await lessons.findByPk(lessonId, {
      attributes: ['id', 'title', 'description', 'content_type', 'content_url', 'content_text', 'order_index', 'week_id', 'created_at', 'updated_at'],
      include: [
        {
          model: weeks,
          as: 'week',
          attributes: ['id', 'week_number', 'title', 'start_date', 'programme_id'],
        },
      ],
    });

    if (!lesson) {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      throw error;
    }

    return lesson;
  }

  /**
   * Create a new week for a programme
   * 
   * @param {number} programmeId - Programme ID
   * @param {Object} weekData - Week data (week_number, title, start_date)
   * @returns {Promise<Object>} - Created week object
   * @throws {Error} - If validation fails or week number already exists
   * 
   * Requirements: 1.3, 7.3
   */
  async createWeek(programmeId, weekData) {
    const { week_number, title, start_date } = weekData;

    console.log('ContentService.createWeek called:', {
      programmeId,
      weekData
    });

    // Validate required fields
    if (week_number === undefined || week_number === null || !title || !start_date) {
      const error = new Error('Missing required fields: week_number, title, start_date');
      error.statusCode = 400;
      console.error('ContentService.createWeek validation failed:', error.message);
      throw error;
    }

    // Validate week number is positive integer >= 1
    if (!Number.isInteger(week_number) || week_number < 1) {
      const error = new Error('Week number must be an integer >= 1');
      error.statusCode = 400;
      console.error('ContentService.createWeek validation failed:', error.message);
      throw error;
    }

    // Validate title length (3-200 characters)
    if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 200) {
      const error = new Error('Title must be between 3 and 200 characters');
      error.statusCode = 400;
      console.error('ContentService.createWeek validation failed:', error.message);
      throw error;
    }

    // Check if week number already exists for this programme
    const existingWeek = await weeks.findOne({
      where: {
        programme_id: programmeId,
        week_number: week_number,
      },
    });

    if (existingWeek) {
      const error = new Error('Week number already exists for this programme');
      error.statusCode = 409;
      console.error('ContentService.createWeek conflict:', error.message, {
        existingWeek: existingWeek.id,
        programmeId,
        week_number
      });
      throw error;
    }

    console.log('ContentService.createWeek: Creating week in database...');

    // Create the week
    const week = await weeks.create({
      programme_id: programmeId,
      week_number,
      title,
      start_date,
    });

    console.log('ContentService.createWeek: Week created successfully:', week.id);

    return week;
  }

  /**
   * Create a new lesson for a week
   * 
   * @param {string} weekId - Week UUID
   * @param {Object} lessonData - Lesson data (title, description, content_type, content_url, order_index)
   * @returns {Promise<Object>} - Created lesson object
   * @throws {Error} - If validation fails
   * 
   * Requirements: 1.4, 1.5, 7.3
   */
  async createLesson(weekId, lessonData) {
    const { title, description, content_type, content_url, content_text, order_index, quiz_data, assignment_data } = lessonData;

    console.log('ContentService.createLesson called:', {
      weekId,
      lessonData
    });

    // Validate required fields based on content type
    if (!title || !content_type || order_index === undefined) {
      const error = new Error('Missing required fields: title, content_type, order_index');
      error.statusCode = 400;
      console.error('ContentService.createLesson validation failed:', error.message);
      throw error;
    }

    // Validate content_type
    const validContentTypes = ['video', 'link', 'pdf', 'text', 'quiz', 'live_session', 'assignment'];
    if (!validContentTypes.includes(content_type)) {
      const error = new Error('Invalid content_type. Must be one of: video, link, pdf, text, quiz, live_session, assignment');
      error.statusCode = 400;
      console.error('ContentService.createLesson validation failed:', error.message);
      throw error;
    }

    // Validate order_index is non-negative
    if (order_index < 0) {
      const error = new Error('Order index must be non-negative');
      error.statusCode = 400;
      console.error('ContentService.createLesson validation failed:', error.message);
      throw error;
    }

    // Validate URL format for URL-based content types only
    if (['video', 'link', 'pdf'].includes(content_type)) {
      if (!content_url) {
        const error = new Error('content_url is required for video, link, and pdf content types');
        error.statusCode = 400;
        console.error('ContentService.createLesson validation failed:', error.message);
        throw error;
      }
      
      try {
        new URL(content_url);
      } catch (e) {
        const error = new Error('Invalid URL format for content_url');
        error.statusCode = 400;
        console.error('ContentService.createLesson validation failed:', error.message);
        throw error;
      }
    }

    console.log('ContentService.createLesson: Creating lesson in database...');

    // Create the lesson with appropriate fields based on content type
    const lessonFields = {
      week_id: weekId,
      title,
      description: description || null,
      content_type,
      order_index,
    };

    // For text lessons, use content_text field
    // For live_session, store JSON data in content_text
    if (content_type === 'text' || content_type === 'live_session') {
      lessonFields.content_text = content_text || null;
      lessonFields.content_url = null;
    } else if (content_type === 'quiz') {
      // Store quiz_data as JSON in content_text; no URL needed
      lessonFields.content_text = quiz_data
        ? (typeof quiz_data === 'string' ? quiz_data : JSON.stringify(quiz_data))
        : (content_text || null);
      lessonFields.content_url = null;
    } else if (content_type === 'assignment') {
      // Store assignment_data as JSON in content_text; no URL needed
      lessonFields.content_text = assignment_data
        ? (typeof assignment_data === 'string' ? assignment_data : JSON.stringify(assignment_data))
        : (content_text || null);
      lessonFields.content_url = null;
    } else {
      // For other types (video, link, pdf), use content_url
      lessonFields.content_url = content_url;
      lessonFields.content_text = null;
    }

    const lesson = await lessons.create(lessonFields);

    console.log('ContentService.createLesson: Lesson created successfully:', lesson.id);

    return lesson;
  }

  /**
   * Update the order of lessons within a week
   * 
   * @param {string} weekId - Week UUID
   * @param {Array<string>} lessonIds - Array of lesson IDs in the desired order
   * @returns {Promise<Array>} - Updated lessons in new order
   * @throws {Error} - If validation fails or lessons don't belong to the week
   * 
   * Requirements: 1.6, 7.4
   */
  async updateLessonOrder(weekId, lessonIds) {
    // Validate input
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      const error = new Error('lessonIds must be a non-empty array');
      error.statusCode = 400;
      throw error;
    }

    // Fetch all lessons for this week
    const weekLessons = await lessons.findAll({
      where: { week_id: weekId },
    });

    // Verify all provided lesson IDs belong to this week
    const weekLessonIds = weekLessons.map(l => l.id);
    const invalidLessonIds = lessonIds.filter(id => !weekLessonIds.includes(id));

    if (invalidLessonIds.length > 0) {
      const error = new Error('Some lesson IDs do not belong to this week');
      error.statusCode = 400;
      throw error;
    }

    // Update order_index for each lesson
    const updatePromises = lessonIds.map((lessonId, index) => {
      return lessons.update(
        { order_index: index },
        { where: { id: lessonId } }
      );
    });

    await Promise.all(updatePromises);

    // Fetch and return updated lessons in new order
    const updatedLessons = await this.getWeekLessons(weekId);
    return updatedLessons;
  }

  /**
   * Update a lesson's content
   * 
   * @param {string} lessonId - Lesson UUID
   * @param {Object} updateData - Fields to update (title, description, content_url)
   * @returns {Promise<Object>} - Updated lesson object
   * @throws {Error} - If lesson not found or validation fails
   * 
   * Requirements: 7.5
   */
  async updateLesson(lessonId, updateData) {
    const lesson = await lessons.findByPk(lessonId);

    if (!lesson) {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate URL if content_url is being updated
    if (updateData.content_url) {
      try {
        new URL(updateData.content_url);
      } catch (e) {
        const error = new Error('Invalid URL format for content_url');
        error.statusCode = 400;
        throw error;
      }
    }

    // Validate content_type if provided
    const validContentTypes = ['video', 'link', 'pdf', 'text', 'live_session', 'quiz', 'assignment'];
    if (updateData.content_type && !validContentTypes.includes(updateData.content_type)) {
      const error = new Error(`Invalid content_type. Must be one of: ${validContentTypes.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Update allowed fields
    const allowedFields = ['title', 'description', 'content_url', 'content_type', 'content_text'];
    const fieldsToUpdate = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fieldsToUpdate[field] = updateData[field];
      }
    });

    // Handle assignment_data: serialize to content_text (same pattern as quiz/live_session)
    if (updateData.assignment_data !== undefined) {
      const serialized = typeof updateData.assignment_data === 'string'
        ? updateData.assignment_data
        : JSON.stringify(updateData.assignment_data);
      fieldsToUpdate.content_text = serialized;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      const error = new Error('No valid fields to update');
      error.statusCode = 400;
      throw error;
    }

    await lesson.update(fieldsToUpdate);

    // Return updated lesson
    return lesson;
  }

  /**
   * Delete a lesson by ID.
   *
   * @param {string} lessonId - Lesson UUID
   * @returns {Promise<void>}
   * @throws {Error} - If lesson not found
   */
  async deleteLesson(lessonId) {
    const lesson = await lessons.findByPk(lessonId);

    if (!lesson) {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      throw error;
    }

    if (db.lesson_completions) {
      await db.lesson_completions.destroy({
        where: { lesson_id: lessonId },
      });
    }

    await lesson.destroy();
  }
}

module.exports = new ContentService();
