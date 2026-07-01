const { Op } = require("sequelize");
const db = require("../models");

/**
 * Service for calculating and persisting learner streak data.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.4, 2.5
 */
class StreakService {
  /**
   * Pure function: given an array of UTC date strings (YYYY-MM-DD),
   * compute { currentStreak, longestStreak }.
   *
   * Algorithm:
   * 1. Deduplicate and sort descending.
   * 2. Determine anchor — today's UTC date. If today has a completion, start
   *    counting from today. If yesterday has a completion (but not today),
   *    start counting from yesterday. Otherwise currentStreak = 0.
   * 3. Walk backwards from anchor for currentStreak.
   * 4. Walk full sorted list for longestStreak.
   *
   * @param {string[]} dates - Array of UTC date strings (YYYY-MM-DD), may contain duplicates
   * @returns {{ currentStreak: number, longestStreak: number }}
   */
  computeStreakFromDates(dates) {
    if (!dates || dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Deduplicate
    const unique = [...new Set(dates)];

    // Sort descending (most recent first)
    unique.sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = this._offsetDate(todayStr, -1);

    // Determine anchor for currentStreak
    let anchor = null;
    if (unique.includes(todayStr)) {
      anchor = todayStr;
    } else if (unique.includes(yesterdayStr)) {
      anchor = yesterdayStr;
    }

    // Calculate currentStreak by walking backwards from anchor
    let currentStreak = 0;
    if (anchor !== null) {
      let expected = anchor;
      for (const date of unique) {
        if (date === expected) {
          currentStreak++;
          expected = this._offsetDate(expected, -1);
        } else if (date < expected) {
          // Gap found — stop
          break;
        }
        // date > expected means we haven't reached the anchor yet (shouldn't happen
        // since list is sorted descending and we start from anchor)
      }
    }

    // Calculate longestStreak by walking the full sorted list
    let longestStreak = 0;
    let runLength = 0;
    let prevDate = null;

    for (const date of unique) {
      if (prevDate === null) {
        runLength = 1;
      } else {
        const expectedNext = this._offsetDate(prevDate, -1);
        if (date === expectedNext) {
          runLength++;
        } else {
          runLength = 1;
        }
      }
      if (runLength > longestStreak) {
        longestStreak = runLength;
      }
      prevDate = date;
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Get stored streak values for a user.
   * Returns { currentStreak: 0, longestStreak: 0 } if no row exists.
   *
   * @param {number} userId
   * @returns {Promise<{ currentStreak: number, longestStreak: number }>}
   */
  async getStreak(userId) {
    try {
      const row = await db.user_streaks.findOne({ where: { user_id: userId } });
      if (!row) {
        return { currentStreak: 0, longestStreak: 0 };
      }
      return {
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
      };
    } catch (err) {
      console.error("[StreakService] Error in getStreak:", err);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  /**
   * Recompute streak from lesson_completions and persist to user_streaks.
   * Called after every lesson completion.
   *
   * @param {number} userId
   * @returns {Promise<{ currentStreak: number, longestStreak: number }>}
   */
  async recalculateStreak(userId) {
    try {
      // Fetch all completion dates for this user
      const completions = await db.lesson_completions.findAll({
        where: { user_id: userId },
        attributes: ["completed_at"],
      });

      // Extract UTC date strings (YYYY-MM-DD)
      const dates = completions.map((c) =>
        new Date(c.completed_at).toISOString().slice(0, 10)
      );

      const { currentStreak, longestStreak } = this.computeStreakFromDates(dates);

      // Determine last_activity_date (most recent date with a completion)
      const uniqueDates = [...new Set(dates)].sort().reverse();
      const lastActivityDate = uniqueDates.length > 0 ? uniqueDates[0] : null;

      // Upsert user_streaks row
      const [row, created] = await db.user_streaks.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: lastActivityDate,
          updated_at: new Date(),
        },
      });

      if (!created) {
        await row.update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: lastActivityDate,
          updated_at: new Date(),
        });
      }

      return { currentStreak, longestStreak };
    } catch (err) {
      console.error("[StreakService] Error in recalculateStreak:", err);
      throw err;
    }
  }

  /**
   * Helper: offset a YYYY-MM-DD date string by `days` days.
   * @param {string} dateStr
   * @param {number} days
   * @returns {string}
   * @private
   */
  _offsetDate(dateStr, days) {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
}

module.exports = new StreakService();
