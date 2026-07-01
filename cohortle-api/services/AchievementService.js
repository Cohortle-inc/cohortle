const { Op, fn, col, literal } = require("sequelize");
const db = require("../models");
const StreakService = require("./StreakService");

/**
 * Service for evaluating achievement criteria and awarding achievements.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
class AchievementService {
  /**
   * Pure function: given a criteria object and user stats, return true if met.
   *
   * @param {{ type: string, threshold?: number }} criteria
   * @param {{ totalLessons: number, currentStreak: number, completedProgrammes: number, distinctActiveDays: number }} stats
   * @returns {boolean}
   */
  isCriteriaMet(criteria, stats) {
    switch (criteria.type) {
      case "first_lesson":
        return stats.totalLessons >= 1;
      case "lessons_completed":
        return stats.totalLessons >= criteria.threshold;
      case "streak_days":
        return stats.currentStreak >= criteria.threshold;
      case "programmes_completed":
        return stats.completedProgrammes >= criteria.threshold;
      case "days_active":
        return stats.distinctActiveDays >= criteria.threshold;
      default:
        return false;
    }
  }

  /**
   * Award a single achievement to a user (idempotent — uses findOrCreate).
   *
   * @param {number} userId
   * @param {string} achievementId
   * @returns {Promise<void>}
   */
  async awardAchievement(userId, achievementId) {
    await db.user_achievements.findOrCreate({
      where: { user_id: userId, achievement_id: achievementId },
      defaults: { user_id: userId, achievement_id: achievementId },
    });
  }

  /**
   * Evaluate all achievement criteria for a user and award any newly met achievements.
   * Errors are caught per-achievement and logged; they do not propagate.
   *
   * @param {number} userId
   * @returns {Promise<void>}
   */
  async evaluateAchievements(userId) {
    // Fetch all achievement definitions
    let achievements = [];
    try {
      achievements = await db.achievements.findAll();
    } catch (err) {
      console.error("[AchievementService] Failed to fetch achievements:", err);
      return;
    }

    if (achievements.length === 0) return;

    // Fetch already-awarded achievement IDs for this user
    let awardedIds = new Set();
    try {
      const awarded = await db.user_achievements.findAll({
        where: { user_id: userId },
        attributes: ["achievement_id"],
      });
      awardedIds = new Set(awarded.map((a) => a.achievement_id));
    } catch (err) {
      console.error("[AchievementService] Failed to fetch user achievements:", err);
      return;
    }

    // Compute user stats
    let stats;
    try {
      stats = await this._computeUserStats(userId);
    } catch (err) {
      console.error("[AchievementService] Failed to compute user stats:", err);
      return;
    }

    // Evaluate each achievement not yet awarded
    for (const achievement of achievements) {
      if (awardedIds.has(achievement.id)) continue;

      try {
        const criteria = achievement.criteria;
        if (this.isCriteriaMet(criteria, stats)) {
          await this.awardAchievement(userId, achievement.id);
        }
      } catch (err) {
        console.error(
          `[AchievementService] Error processing achievement ${achievement.id}:`,
          err
        );
        // Continue processing remaining achievements
      }
    }
  }

  /**
   * Compute user stats needed for achievement evaluation.
   *
   * @param {number} userId
   * @returns {Promise<{ totalLessons: number, currentStreak: number, completedProgrammes: number, distinctActiveDays: number }>}
   * @private
   */
  async _computeUserStats(userId) {
    // Total lessons completed
    const totalLessons = await db.lesson_completions.count({
      where: { user_id: userId },
    });

    // Current streak from StreakService
    const { currentStreak } = await StreakService.getStreak(userId);

    // Completed programmes: enrollments where all lessons in the programme are completed
    const completedProgrammes = await this._countCompletedProgrammes(userId);

    // Distinct active days: count of distinct calendar dates with at least one completion
    const completions = await db.lesson_completions.findAll({
      where: { user_id: userId },
      attributes: ["completed_at"],
    });
    const distinctDates = new Set(
      completions.map((c) => new Date(c.completed_at).toISOString().slice(0, 10))
    );
    const distinctActiveDays = distinctDates.size;

    return { totalLessons, currentStreak, completedProgrammes, distinctActiveDays };
  }

  /**
   * Count the number of programmes where the user has completed all lessons.
   *
   * @param {number} userId
   * @returns {Promise<number>}
   * @private
   */
  async _countCompletedProgrammes(userId) {
    try {
      const enrollments = await db.enrollments.findAll({
        where: { user_id: userId },
        include: [
          {
            model: db.cohorts,
            as: "cohort",
            include: [
              {
                model: db.programmes,
                as: "programme",
                include: [
                  {
                    model: db.weeks,
                    as: "weeks",
                    include: [{ model: db.lessons, as: "lessons" }],
                  },
                ],
              },
            ],
          },
        ],
      });

      let count = 0;
      for (const enrollment of enrollments) {
        const programme = enrollment.cohort?.programme;
        if (!programme) continue;

        const allLessonIds = [];
        (programme.weeks || []).forEach((week) => {
          (week.lessons || []).forEach((lesson) => allLessonIds.push(lesson.id));
        });

        if (allLessonIds.length === 0) continue;

        const completedCount = await db.lesson_completions.count({
          where: {
            user_id: userId,
            cohort_id: enrollment.cohort_id,
            lesson_id: { [Op.in]: allLessonIds },
          },
        });

        if (completedCount === allLessonIds.length) count++;
      }

      return count;
    } catch (err) {
      console.error("[AchievementService] Error counting completed programmes:", err);
      return 0;
    }
  }
}

module.exports = new AchievementService();
