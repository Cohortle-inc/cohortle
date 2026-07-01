/**
 * ProgrammeService
 * 
 * Handles programme retrieval, current week calculation, and week filtering.
 * Provides methods to fetch programme data and determine current week based on cohort start dates.
 * 
 * Requirements: 3.1, 3.2, 3.5
 */

const db = require('../models');
const { programmes, cohorts, weeks, lessons } = db;

class ProgrammeService {
  /**
   * Get programme by ID with basic metadata
   * 
   * @param {number} programmeId - Programme ID
   * @returns {Promise<Object>} - Programme object
   * @throws {Error} - If programme not found
   * 
   * Requirements: 3.1
   */
  async getProgrammeById(programmeId) {
    const programme = await programmes.findByPk(programmeId, {
      attributes: ['id', 'name', 'description', 'start_date', 'created_at', 'updated_at'],
    });

    if (!programme) {
      const error = new Error('Programme not found');
      error.statusCode = 404;
      throw error;
    }

    return programme;
  }

  /**
   * Calculate current week number based on cohort start date
   * 
   * The current week is calculated as: floor((days since start) / 7) + 1
   * with a minimum value of 1.
   * 
   * @param {number} programmeId - Programme ID
   * @param {number} cohortId - Cohort ID (optional, uses first cohort if not provided)
   * @returns {Promise<number>} - Current week number (1-indexed)
   * 
   * Requirements: 3.2
   */
  async getCurrentWeek(programmeId, cohortId = null) {
    let cohort;

    if (cohortId) {
      // Use specified cohort
      cohort = await cohorts.findOne({
        where: {
          id: cohortId,
          programme_id: programmeId,
        },
      });
    } else {
      // Use first cohort for the programme
      cohort = await cohorts.findOne({
        where: { programme_id: programmeId },
        order: [['start_date', 'ASC']],
      });
    }

    if (!cohort || !cohort.start_date) {
      // If no cohort or no start date, default to week 1
      return 1;
    }

    const now = new Date();
    const startDate = new Date(cohort.start_date);

    // Calculate days since start
    const daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate week number (1-indexed)
    const weekNumber = Math.floor(daysSinceStart / 7) + 1;

    // Return at least week 1
    return Math.max(1, weekNumber);
  }

  /**
   * Get ALL programme weeks with lessons (no current-week filtering)
   * Used for convener/admin views where all weeks should be visible
   *
   * @param {number} programmeId - Programme ID
   * @returns {Promise<Array>} - Array of all week objects with lessons
   */
  async getAllProgrammeWeeks(programmeId) {
    const programmeWeeks = await weeks.findAll({
      where: { programme_id: programmeId },
      include: [
        {
          model: lessons,
          as: 'lessons',
          attributes: ['id', 'title', 'description', 'content_type', 'content_url', 'content_text', 'order_index'],
          required: false,
        },
      ],
      order: [
        ['week_number', 'ASC'],
        [{ model: lessons, as: 'lessons' }, 'order_index', 'ASC'],
      ],
    });

    return programmeWeeks.map((week) => week.toJSON());
  }

  /**
   * Get programme weeks with lessons, filtered to show only past and current weeks
   * 
   * @param {number} programmeId - Programme ID
   * @param {number} cohortId - Cohort ID (optional, for current week calculation)
   * @param {number} userId - User ID (optional, for completion status)
   * @returns {Promise<Array>} - Array of week objects with lessons
   * 
   * Requirements: 3.5
   */
  async getProgrammeWeeks(programmeId, cohortId = null, userId = null) {
    // Get current week number
    const currentWeek = await this.getCurrentWeek(programmeId, cohortId);

    // Fetch weeks with lessons, filtering by current week
    const programmeWeeks = await weeks.findAll({
      where: {
        programme_id: programmeId,
      },
      include: [
        {
          model: lessons,
          as: 'lessons',
          attributes: ['id', 'title', 'description', 'content_type', 'content_url', 'content_text', 'order_index'],
          required: false,
        },
      ],
      order: [
        ['week_number', 'ASC'],
        [{ model: lessons, as: 'lessons' }, 'order_index', 'ASC'],
      ],
    });

    // All weeks are returned; the frontend handles locked/unlocked display
    // based on start_date. We keep currentWeek for the isCurrent flag only.
    const filteredWeeks = programmeWeeks;

    // If userId and cohortId are provided, fetch completion status for all lessons
    let completionMap = {};
    if (userId && cohortId) {
      const BackendSDK = require('../core/BackendSDK');
      const sdk = new BackendSDK();
      
      // Get all lesson IDs from filtered weeks
      const lessonIds = filteredWeeks.flatMap(week => 
        week.lessons.map(lesson => `'${lesson.id}'`)
      );
      
      if (lessonIds.length > 0) {
        // lesson_completions: presence of a row means the lesson is completed
        const completionQuery = `
          SELECT lesson_id, completed_at
          FROM lesson_completions
          WHERE user_id = ${userId}
            AND cohort_id = ${cohortId}
            AND lesson_id IN (${lessonIds.join(',')})
        `;
        
        const completionData = await sdk.rawQuery(completionQuery);
        completionMap = completionData.reduce((acc, item) => {
          acc[item.lesson_id] = {
            completed: true, // row existence = completed
            completed_at: item.completed_at,
          };
          return acc;
        }, {});
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add isCurrent, lock state, and completion status to each week
    return filteredWeeks.map((week) => {
      const weekData = week.toJSON();
      const weekStartDate = week.start_date ? new Date(week.start_date) : null;
      if (weekStartDate) {
        weekStartDate.setHours(0, 0, 0, 0);
      }
      const isLocked = weekStartDate ? weekStartDate > today : false;
      
      // Add completion status to lessons if available
      if (Object.keys(completionMap).length > 0) {
        weekData.lessons = weekData.lessons.map(lesson => ({
          ...lesson,
          completed: completionMap[lesson.id]?.completed || false,
          completed_at: completionMap[lesson.id]?.completed_at || null,
        }));
      }
      
      return {
        ...weekData,
        isCurrent: !isLocked && week.week_number === currentWeek,
        isLocked,
        locked_until: isLocked ? week.start_date : null,
      };
    });
  }
}

module.exports = new ProgrammeService();
