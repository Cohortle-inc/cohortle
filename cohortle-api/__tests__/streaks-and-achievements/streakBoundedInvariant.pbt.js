/**
 * Property-Based Test: Current streak is bounded by longest streak
 *
 * // Feature: streaks-and-achievements, Property 2: current streak is bounded by longest streak
 *
 * **Validates: Requirements 1.5**
 *
 * For any set of lesson completion timestamps, the currentStreak returned by
 * computeStreakFromDates SHALL always be less than or equal to longestStreak.
 */

const fc = require('fast-check');

// Import the service without DB by mocking models
jest.mock('../../models', () => ({
  user_streaks: { findOne: jest.fn(), findOrCreate: jest.fn() },
  lesson_completions: { findAll: jest.fn() },
}));

const streakService = require('../../services/StreakService');

// Arbitrary: generate a YYYY-MM-DD string within the last 90 days
const recentDateArb = fc.integer({ min: 0, max: 89 }).map((offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
});

// Arbitrary: array of 0–30 recent dates (may contain duplicates)
const dateArrayArb = fc.array(recentDateArb, { minLength: 0, maxLength: 30 });

describe('Feature: streaks-and-achievements, Property 2: current streak is bounded by longest streak', () => {
  it('currentStreak is always <= longestStreak', () => {
    fc.assert(
      fc.property(dateArrayArb, (dates) => {
        const { currentStreak, longestStreak } = streakService.computeStreakFromDates(dates);

        expect(currentStreak).toBeGreaterThanOrEqual(0);
        expect(longestStreak).toBeGreaterThanOrEqual(0);
        expect(currentStreak).toBeLessThanOrEqual(longestStreak);
      }),
      { numRuns: 100 }
    );
  });

  it('both values are non-negative integers', () => {
    fc.assert(
      fc.property(dateArrayArb, (dates) => {
        const { currentStreak, longestStreak } = streakService.computeStreakFromDates(dates);

        expect(Number.isInteger(currentStreak)).toBe(true);
        expect(Number.isInteger(longestStreak)).toBe(true);
        expect(currentStreak).toBeGreaterThanOrEqual(0);
        expect(longestStreak).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});
