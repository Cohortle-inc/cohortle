/**
 * Property-based test for AchievementService.isCriteriaMet
 *
 * // Feature: streaks-and-achievements, Property 4: achievement criteria evaluation is a pure function
 *
 * Validates: Requirements 6.4
 */

const fc = require("fast-check");

// Get a fresh service instance with mocked DB
function getService() {
  jest.resetModules();
  jest.mock("../../models", () => ({
    achievements: { findAll: jest.fn() },
    user_achievements: { findAll: jest.fn(), findOrCreate: jest.fn() },
    lesson_completions: { count: jest.fn(), findAll: jest.fn() },
    enrollments: { findAll: jest.fn() },
  }));
  jest.mock("../../services/StreakService", () => ({
    getStreak: jest.fn().mockResolvedValue({ currentStreak: 0, longestStreak: 0 }),
  }));
  return require("../../services/AchievementService");
}

describe("Property 4: isCriteriaMet is a pure function", () => {
  let service;

  beforeEach(() => {
    service = getService();
  });

  // Arbitrary for criteria type
  const criteriaTypeArb = fc.oneof(
    fc.constant("first_lesson"),
    fc.constant("lessons_completed"),
    fc.constant("streak_days"),
    fc.constant("programmes_completed"),
    fc.constant("days_active"),
    fc.string() // unknown types → always false
  );

  // Arbitrary for a criteria object
  const criteriaArb = fc.record({
    type: criteriaTypeArb,
    threshold: fc.integer({ min: 0, max: 1000 }),
  });

  // Arbitrary for stats object
  const statsArb = fc.record({
    totalLessons: fc.integer({ min: 0, max: 1000 }),
    currentStreak: fc.integer({ min: 0, max: 365 }),
    completedProgrammes: fc.integer({ min: 0, max: 100 }),
    distinctActiveDays: fc.integer({ min: 0, max: 365 }),
  });

  test("returns the same boolean on repeated calls with the same inputs", () => {
    fc.assert(
      fc.property(criteriaArb, statsArb, (criteria, stats) => {
        const result1 = service.isCriteriaMet(criteria, stats);
        const result2 = service.isCriteriaMet(criteria, stats);
        const result3 = service.isCriteriaMet(criteria, stats);
        return result1 === result2 && result2 === result3;
      }),
      { numRuns: 200 }
    );
  });

  test("returns a boolean for all valid inputs", () => {
    fc.assert(
      fc.property(criteriaArb, statsArb, (criteria, stats) => {
        const result = service.isCriteriaMet(criteria, stats);
        return typeof result === "boolean";
      }),
      { numRuns: 200 }
    );
  });

  test("unknown criteria type always returns false", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) =>
          !["first_lesson", "lessons_completed", "streak_days", "programmes_completed", "days_active"].includes(s)
        ),
        statsArb,
        (unknownType, stats) => {
          return service.isCriteriaMet({ type: unknownType, threshold: 1 }, stats) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("first_lesson: returns true iff totalLessons >= 1", () => {
    fc.assert(
      fc.property(statsArb, (stats) => {
        const result = service.isCriteriaMet({ type: "first_lesson", threshold: 1 }, stats);
        return result === (stats.totalLessons >= 1);
      }),
      { numRuns: 200 }
    );
  });

  test("lessons_completed: returns true iff totalLessons >= threshold", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        statsArb,
        (threshold, stats) => {
          const result = service.isCriteriaMet({ type: "lessons_completed", threshold }, stats);
          return result === (stats.totalLessons >= threshold);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("streak_days: returns true iff currentStreak >= threshold", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }),
        statsArb,
        (threshold, stats) => {
          const result = service.isCriteriaMet({ type: "streak_days", threshold }, stats);
          return result === (stats.currentStreak >= threshold);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("programmes_completed: returns true iff completedProgrammes >= threshold", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        statsArb,
        (threshold, stats) => {
          const result = service.isCriteriaMet({ type: "programmes_completed", threshold }, stats);
          return result === (stats.completedProgrammes >= threshold);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("days_active: returns true iff distinctActiveDays >= threshold", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }),
        statsArb,
        (threshold, stats) => {
          const result = service.isCriteriaMet({ type: "days_active", threshold }, stats);
          return result === (stats.distinctActiveDays >= threshold);
        }
      ),
      { numRuns: 200 }
    );
  });
});
