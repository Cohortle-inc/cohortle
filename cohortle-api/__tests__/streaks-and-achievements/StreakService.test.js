/**
 * Unit tests for StreakService.computeStreakFromDates
 *
 * Tests the pure function directly — no database connection required.
 * DB-dependent methods (getStreak, recalculateStreak) are tested with mocks.
 *
 * Requirements: 1.3, 1.4, 1.7
 */

// We need to import the class directly (not the singleton) so we can call
// computeStreakFromDates without a DB. We do this by requiring the module and
// accessing the underlying class via a small trick: re-require after clearing cache.

// Helper: get a fresh StreakService instance whose DB calls we can mock
function getService() {
  // Clear module cache so we get a fresh instance each time
  jest.resetModules();
  // Mock the db module so the constructor doesn't blow up
  jest.mock('../../models', () => ({
    user_streaks: {
      findOne: jest.fn(),
      findOrCreate: jest.fn(),
    },
    lesson_completions: {
      findAll: jest.fn(),
    },
  }));
  return require('../../services/StreakService');
}

describe('StreakService.computeStreakFromDates — unit tests', () => {
  let service;

  beforeEach(() => {
    service = getService();
  });

  // Helper: return a YYYY-MM-DD string offset from today by `n` days
  function today(offset = 0) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  test('empty array → { currentStreak: 0, longestStreak: 0 }', () => {
    expect(service.computeStreakFromDates([])).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  test('null input → { currentStreak: 0, longestStreak: 0 }', () => {
    expect(service.computeStreakFromDates(null)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  test('single date today → { currentStreak: 1, longestStreak: 1 }', () => {
    expect(service.computeStreakFromDates([today()])).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  test('single date yesterday → { currentStreak: 1, longestStreak: 1 }', () => {
    expect(service.computeStreakFromDates([today(-1)])).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  test('7 consecutive days ending today → { currentStreak: 7, longestStreak: 7 }', () => {
    const dates = Array.from({ length: 7 }, (_, i) => today(-i));
    expect(service.computeStreakFromDates(dates)).toEqual({ currentStreak: 7, longestStreak: 7 });
  });

  test('gap two days ago (today and 3+ days ago, but not yesterday or 2 days ago) → currentStreak: 1', () => {
    // today + 3 days ago (gap at yesterday and 2 days ago)
    const dates = [today(), today(-3), today(-4), today(-5)];
    const result = service.computeStreakFromDates(dates);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(3); // 3-day run: -3, -4, -5
  });

  test('completions only yesterday → currentStreak: 1', () => {
    expect(service.computeStreakFromDates([today(-1)])).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  test('no completions today or yesterday → currentStreak: 0', () => {
    const dates = [today(-2), today(-3), today(-4)];
    const result = service.computeStreakFromDates(dates);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
  });

  test('duplicate dates are deduplicated', () => {
    const dates = [today(), today(), today(-1), today(-1)];
    expect(service.computeStreakFromDates(dates)).toEqual({ currentStreak: 2, longestStreak: 2 });
  });

  test('unsorted input produces same result as sorted input', () => {
    const sorted = [today(), today(-1), today(-2)];
    const unsorted = [today(-2), today(), today(-1)];
    expect(service.computeStreakFromDates(sorted)).toEqual(service.computeStreakFromDates(unsorted));
  });

  test('longest streak is tracked across a gap', () => {
    // 5-day run in the past, then a gap, then 2-day run ending today
    const dates = [
      today(),
      today(-1),
      today(-10),
      today(-11),
      today(-12),
      today(-13),
      today(-14),
    ];
    const result = service.computeStreakFromDates(dates);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });
});

describe('StreakService.getStreak — mocked DB', () => {
  let service;
  let db;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../../models', () => ({
      user_streaks: {
        findOne: jest.fn(),
        findOrCreate: jest.fn(),
      },
      lesson_completions: {
        findAll: jest.fn(),
      },
    }));
    service = require('../../services/StreakService');
    db = require('../../models');
  });

  test('returns { currentStreak: 0, longestStreak: 0 } when no row exists', async () => {
    db.user_streaks.findOne.mockResolvedValue(null);
    const result = await service.getStreak(42);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  test('returns stored values when row exists', async () => {
    db.user_streaks.findOne.mockResolvedValue({ current_streak: 5, longest_streak: 12 });
    const result = await service.getStreak(42);
    expect(result).toEqual({ currentStreak: 5, longestStreak: 12 });
  });

  test('returns { currentStreak: 0, longestStreak: 0 } on DB error', async () => {
    db.user_streaks.findOne.mockRejectedValue(new Error('DB error'));
    const result = await service.getStreak(42);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
  });
});

describe('StreakService.recalculateStreak — mocked DB', () => {
  let service;
  let db;

  function today(offset = 0) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../../models', () => ({
      user_streaks: {
        findOne: jest.fn(),
        findOrCreate: jest.fn(),
      },
      lesson_completions: {
        findAll: jest.fn(),
      },
    }));
    service = require('../../services/StreakService');
    db = require('../../models');
  });

  test('upserts correct streak values from completions', async () => {
    const completions = [
      { completed_at: today() + 'T10:00:00Z' },
      { completed_at: today(-1) + 'T10:00:00Z' },
    ];
    db.lesson_completions.findAll.mockResolvedValue(completions);

    const mockRow = { update: jest.fn().mockResolvedValue(true) };
    db.user_streaks.findOrCreate.mockResolvedValue([mockRow, false]);

    const result = await service.recalculateStreak(1);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(mockRow.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_streak: 2, longest_streak: 2 })
    );
  });

  test('returns { currentStreak: 0, longestStreak: 0 } when no completions', async () => {
    db.lesson_completions.findAll.mockResolvedValue([]);
    const mockRow = { update: jest.fn().mockResolvedValue(true) };
    db.user_streaks.findOrCreate.mockResolvedValue([mockRow, true]);

    const result = await service.recalculateStreak(1);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
  });
});
