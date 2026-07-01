/**
 * Property-Based Test: Streak is a pure function of completion dates
 *
 * // Feature: streaks-and-achievements, Property 1: streak is a pure function of completion dates
 *
 * **Validates: Requirements 1.2, 1.3**
 *
 * For any set of lesson completion timestamps, computeStreakFromDates SHALL
 * produce the same { currentStreak, longestStreak } regardless of the order
 * in which the dates are provided.
 */

const fc = require('fast-check');

// Import the service without DB by mocking models
jest.mock('../../models', () => ({
  user_streaks: { findOne: jest.fn(), findOrCreate: jest.fn() },
  lesson_completions: { findAll: jest.fn() },
}));

const streakService = require('../../services/StreakService');

// Arbitrary: generate a YYYY-MM-DD string within the last 60 days
const recentDateArb = fc.integer({ min: 0, max: 59 }).map((offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
});

// Arbitrary: array of 0–20 recent dates (may contain duplicates)
const dateArrayArb = fc.array(recentDateArb, { minLength: 0, maxLength: 20 });

describe('Feature: streaks-and-achievements, Property 1: streak is a pure function of completion dates', () => {
  it('returns the same result regardless of input order', () => {
    fc.assert(
      fc.property(dateArrayArb, (dates) => {
        // Shuffle the array to create a different ordering
        const shuffled = [...dates].sort(() => Math.random() - 0.5);

        const result1 = streakService.computeStreakFromDates(dates);
        const result2 = streakService.computeStreakFromDates(shuffled);

        expect(result1.currentStreak).toBe(result2.currentStreak);
        expect(result1.longestStreak).toBe(result2.longestStreak);
      }),
      { numRuns: 100 }
    );
  });

  it('returns the same result when called multiple times with the same input', () => {
    fc.assert(
      fc.property(dateArrayArb, (dates) => {
        const result1 = streakService.computeStreakFromDates(dates);
        const result2 = streakService.computeStreakFromDates(dates);

        expect(result1).toEqual(result2);
      }),
      { numRuns: 100 }
    );
  });
});
