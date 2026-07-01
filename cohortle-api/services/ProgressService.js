const { Op } = require("sequelize");
const db = require("../models");

/**
 * Service for tracking and calculating learner progress
 * Handles lesson completions, progress calculations, and activity tracking
 * 
 * Requirements: 2.4, 2.9, 2.11, 3.6, 4.9, 4.10, 6.1, 6.2, 6.4, 6.10
 */
class ProgressService {
  /**
   * Calculate programme progress for a user
   * Progress = (completed lessons / total lessons) × 100
   * 
   * @param {number} userId - The user ID
   * @param {number} programmeId - The programme ID
   * @param {number} cohortId - The cohort ID
   * @returns {Promise<{progress: number, completedLessons: number, totalLessons: number}>}
   * 
   * Requirements: 2.4, 6.1
   */
  async calculateProgrammeProgress(userId, programmeId, cohortId) {
    try {
      // Try WLIMP model first (Weeks/Lessons)
      const weeks = await db.weeks.findAll({
        where: { programme_id: programmeId },
        attributes: ["id"],
      });

      if (weeks.length > 0) {
        const weekIds = weeks.map((week) => week.id);
        const lessons = await db.lessons.findAll({
          where: { week_id: { [Op.in]: weekIds } },
          attributes: ["id"],
        });

        const totalLessons = lessons.length;
        if (totalLessons > 0) {
          const lessonIds = lessons.map((lesson) => lesson.id);
          const completedLessons = await db.lesson_completions.count({
            where: {
              user_id: userId,
              lesson_id: { [Op.in]: lessonIds },
              cohort_id: cohortId,
            },
          });

          return {
            progress: Math.round((completedLessons / totalLessons) * 100),
            completedLessons,
            totalLessons,
          };
        }
      }

      // Fallback to Legacy model (Learning Units/Module Lessons)
      const modules = await db.programme_modules.findAll({
        where: { programme_id: programmeId },
        attributes: ["id"]
      });

      if (modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        const legacyLessons = await db.module_lessons.findAll({
          where: { module_id: { [Op.in]: moduleIds } },
          attributes: ["id"]
        });

        const totalLessons = legacyLessons.length;
        if (totalLessons > 0) {
          const lessonIds = legacyLessons.map(l => l.id);
          const completedLessons = await db.lesson_progress.count({
            where: {
              user_id: userId,
              lesson_id: { [Op.in]: lessonIds },
              completed: true,
              ...(cohortId && { cohort_id: cohortId })
            }
          });

          return {
            progress: Math.round((completedLessons / totalLessons) * 100),
            completedLessons,
            totalLessons,
          };
        }
      }

      return {
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
      };
    } catch (error) {
      console.error("Error calculating programme progress:", error);
      throw error;
    }
  }

  /**
   * Calculate week progress for a user
   * Progress = (completed lessons in week / total lessons in week) × 100
   * 
   * @param {number} userId - The user ID
   * @param {string} weekId - The week ID (UUID)
   * @param {number} cohortId - The cohort ID
   * @returns {Promise<{progress: number, completedLessons: number, totalLessons: number}>}
   * 
   * Requirements: 3.6, 6.2
   */
  async calculateWeekProgress(userId, weekId, cohortId) {
    try {
      // Get all lessons in the week
      const lessons = await db.lessons.findAll({
        where: { week_id: weekId },
        attributes: ["id"],
      });

      const totalLessons = lessons.length;

      if (totalLessons === 0) {
        return {
          progress: 0,
          completedLessons: 0,
          totalLessons: 0,
        };
      }

      const lessonIds = lessons.map((lesson) => lesson.id);

      // Count completed lessons
      const completedLessons = await db.lesson_completions.count({
        where: {
          user_id: userId,
          lesson_id: { [Op.in]: lessonIds },
          cohort_id: cohortId,
        },
      });

      // Calculate progress percentage
      const progress = Math.round((completedLessons / totalLessons) * 100);

      return {
        progress,
        completedLessons,
        totalLessons,
      };
    } catch (error) {
      console.error("Error calculating week progress:", error);
      throw error;
    }
  }

  /**
   * Mark a lesson as complete for a user
   * Creates or updates a completion record
   * 
   * @param {number} userId - The user ID
   * @param {string} lessonId - The lesson ID (UUID)
   * @param {number} cohortId - The cohort ID
   * @returns {Promise<{success: boolean, completedAt: string}>}
   * 
   * Requirements: 4.9, 6.4
   */
  async markLessonComplete(userId, lessonId, cohortId) {
    try {
      // Use findOrCreate to handle idempotency
      const [completion, created] = await db.lesson_completions.findOrCreate({
        where: {
          user_id: userId,
          lesson_id: lessonId,
          cohort_id: cohortId,
        },
        defaults: {
          user_id: userId,
          lesson_id: lessonId,
          cohort_id: cohortId,
          completed_at: new Date(),
        },
      });

      return {
        success: true,
        completedAt: completion.completed_at.toISOString(),
      };
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      throw error;
    }
  }

  /**
   * Mark a lesson as incomplete for a user
   * Deletes the completion record
   * 
   * @param {number} userId - The user ID
   * @param {string} lessonId - The lesson ID (UUID)
   * @param {number} cohortId - The cohort ID
   * @returns {Promise<{success: boolean}>}
   * 
   * Requirements: 4.9
   */
  async markLessonIncomplete(userId, lessonId, cohortId) {
    try {
      await db.lesson_completions.destroy({
        where: {
          user_id: userId,
          lesson_id: lessonId,
          cohort_id: cohortId,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error marking lesson incomplete:", error);
      throw error;
    }
  }
  /**
   * Check if a lesson is completed by a user in a cohort
   * @param {number} userId - The user ID
   * @param {string} lessonId - The lesson ID (UUID for WLIMP lessons)
   * @param {number} cohortId - The cohort ID
   * @returns {Promise<boolean>} - True if lesson is completed, false otherwise
   */
  async isLessonComplete(userId, lessonId, cohortId) {
    try {
      const completion = await db.lesson_completions.findOne({
        where: {
          user_id: userId,
          lesson_id: lessonId,
          cohort_id: cohortId,
        },
      });

      return !!completion;
    } catch (error) {
      console.error("Error checking lesson completion:", error);
      throw error;
    }
  }

  /**
   * Get user's recent activity (completed lessons)
   * Returns the most recently completed lessons with details
   * 
   * @param {number} userId - The user ID
   * @param {number} limit - Maximum number of activities to return (default 5)
   * @returns {Promise<Array<{id: string, title: string, programmeName: string, completedAt: string}>>}
   * 
   * Requirements: 2.9, 2.10
   */
  async getRecentActivity(userId, limit = 5) {
    try {
      const completions = await db.lesson_completions.findAll({
        where: { user_id: userId },
        include: [
          {
            model: db.lessons,
            as: "lesson",
            attributes: ["id", "title", "week_id"],
            include: [
              {
                model: db.weeks,
                as: "week",
                attributes: ["programme_id"],
                include: [
                  {
                    model: db.programmes,
                    as: "programme",
                    attributes: ["name"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["completed_at", "DESC"]],
        limit: limit,
      });

      return completions.map((completion) => ({
        id: completion.lesson.id,
        title: completion.lesson.title,
        programmeName: completion.lesson.week.programme.name,
        completedAt: completion.completed_at.toISOString(),
      }));
    } catch (error) {
      console.error("Error getting recent activity:", error);
      throw error;
    }
  }

  /**
   * Get the next incomplete lesson for a user across all enrolled programmes
   * Respects week unlock dates and returns the first incomplete lesson
   * 
   * @param {number} userId - The user ID
   * @returns {Promise<{id: string, title: string, programmeId: number} | null>}
   * 
   * Requirements: 2.11, 2.12
   */
  async getNextIncompleteLesson(userId) {
    try {
      // Get all cohorts the user is enrolled in
      const enrollments = await db.enrollments.findAll({
        where: { user_id: userId },
        attributes: ["cohort_id"],
      });

      if (enrollments.length === 0) {
        return null;
      }

      const cohortIds = enrollments.map((e) => e.cohort_id);

      // Get cohorts with their programmes
      const cohorts = await db.cohorts.findAll({
        where: { id: { [Op.in]: cohortIds } },
        attributes: ["id", "programme_id"],
      });

      if (cohorts.length === 0) {
        return null;
      }

      const programmeIds = [...new Set(cohorts.map((c) => c.programme_id))];

      // Get all weeks that are unlocked (start_date <= today)
      const today = new Date().toISOString().split("T")[0];
      const unlockedWeeks = await db.weeks.findAll({
        where: {
          programme_id: { [Op.in]: programmeIds },
          start_date: { [Op.lte]: today },
        },
        attributes: ["id", "programme_id", "week_number"],
        order: [
          ["programme_id", "ASC"],
          ["week_number", "ASC"],
        ],
      });

      if (unlockedWeeks.length === 0) {
        return null;
      }

      const weekIds = unlockedWeeks.map((w) => w.id);

      // Get all lessons in unlocked weeks
      const lessons = await db.lessons.findAll({
        where: { week_id: { [Op.in]: weekIds } },
        attributes: ["id", "title", "week_id", "order_index"],
        order: [["order_index", "ASC"]],
      });

      if (lessons.length === 0) {
        return null;
      }

      // Get completed lesson IDs for this user
      const completedLessonIds = await db.lesson_completions.findAll({
        where: {
          user_id: userId,
          cohort_id: { [Op.in]: cohortIds },
        },
        attributes: ["lesson_id"],
      }).then((completions) => completions.map((c) => c.lesson_id));

      // Find first incomplete lesson
      for (const lesson of lessons) {
        if (!completedLessonIds.includes(lesson.id)) {
          const week = unlockedWeeks.find((w) => w.id === lesson.week_id);
          return {
            id: lesson.id,
            title: lesson.title,
            programmeId: week.programme_id,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting next incomplete lesson:", error);
      throw error;
    }
  }

  /**
   * Get learner aggregate stats across specific programmes
   *
   * @param {number} userId - The user ID
   * @param {number[]} programmeIds - Array of programme IDs to include in stats
   * @returns {Promise<{totalProgrammes: number, completedProgrammes: number, totalLessons: number, completedLessons: number, overallCompletionRate: number}>}
   */
  async getLearnerAggregateStats(userId, programmeIds) {
    try {
      if (!programmeIds || programmeIds.length === 0) {
        return {
          totalProgrammes: 0,
          completedProgrammes: 0,
          totalLessons: 0,
          completedLessons: 0,
          overallCompletionRate: 0,
        };
      }

      // Get all enrollments for these programmes
      const enrollments = await db.enrollments.findAll({
        where: { user_id: userId },
        include: [
          {
            model: db.cohorts,
            as: "cohort",
            where: { programme_id: { [Op.in]: programmeIds } },
            attributes: ["id", "programme_id"],
          },
        ],
      });

      let totalLessons = 0;
      let completedLessons = 0;
      let completedProgrammes = 0;

      for (const enrollment of enrollments) {
        const stats = await this.calculateProgrammeProgress(
          userId,
          enrollment.cohort.programme_id,
          enrollment.cohort.id,
        );

        totalLessons += stats.totalLessons;
        completedLessons += stats.completedLessons;
        if (stats.progress === 100) {
          completedProgrammes++;
        }
      }

      const overallCompletionRate = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      return {
        totalProgrammes: enrollments.length,
        completedProgrammes,
        totalLessons,
        completedLessons,
        overallCompletionRate,
      };
    } catch (error) {
      console.error("Error getting learner aggregate stats:", error);
      throw error;
    }
  }

  /**
   * LEGACY METHOD - Calculate progress for a Learning Unit for a specific user
   * Kept for backward compatibility with existing code
   * 
   * @param {number} moduleId - The Learning Unit (module) ID
   * @param {number} userId - The user ID
   * @param {number} cohortId - The cohort ID (optional, for cohort-specific progress)
   * @returns {Promise<{completed_lessons: number, total_lessons: number, percentage: number}>}
   */
  async calculateUnitProgress(moduleId, userId, cohortId = null) {
    try {
      // Get all lessons in the Learning Unit
      const lessons = await db.module_lessons.findAll({
        where: { module_id: moduleId },
        attributes: ["id"],
      });

      const totalLessons = lessons.length;

      // Handle edge case: no lessons in the unit
      if (totalLessons === 0) {
        return {
          completed_lessons: 0,
          total_lessons: 0,
          percentage: 0,
        };
      }

      // Get lesson IDs
      const lessonIds = lessons.map((lesson) => lesson.id);

      // Build where clause for lesson progress
      const whereClause = {
        lesson_id: { [Op.in]: lessonIds },
        user_id: userId,
        completed: true,
      };

      // Add cohort filter if provided
      if (cohortId) {
        whereClause.cohort_id = cohortId;
      }

      // Count completed lessons for the user
      const completedLessons = await db.lesson_progress.count({
        where: whereClause,
      });

      // Calculate percentage
      const percentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        completed_lessons: completedLessons,
        total_lessons: totalLessons,
        percentage: percentage,
      };
    } catch (error) {
      console.error("Error calculating unit progress:", error);
      // Return zero progress on error to prevent API failures
      return {
        completed_lessons: 0,
        total_lessons: 0,
        percentage: 0,
      };
    }
  }

  /**
   * LEGACY METHOD - Calculate progress for multiple Learning Units for a specific user
   * Kept for backward compatibility with existing code
   * 
   * @param {number[]} moduleIds - Array of Learning Unit (module) IDs
   * @param {number} userId - The user ID
   * @param {number} cohortId - The cohort ID (optional)
   * @returns {Promise<Object>} Map of moduleId to progress object
   */
  async calculateMultipleUnitProgress(moduleIds, userId, cohortId = null) {
    try {
      const progressMap = {};

      // Calculate progress for each unit
      await Promise.all(
        moduleIds.map(async (moduleId) => {
          const progress = await this.calculateUnitProgress(
            moduleId,
            userId,
            cohortId,
          );
          progressMap[moduleId] = progress;
        }),
      );

      return progressMap;
    } catch (error) {
      console.error("Error calculating multiple unit progress:", error);
      return {};
    }
  }
}

module.exports = new ProgressService();
