/**
 * Unit tests for AchievementService
 *
 * Tests isCriteriaMet directly as a pure function (no mocking needed).
 * Tests evaluateAchievements and awardAchievement with mocked DB.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

function getService() {
  jest.resetModules();
  jest.mock("../../models", () => ({
    achievements: { findAll: jest.fn() },
    user_achievements: { findAll: jest.fn(), findOrCreate: jest.fn() },
    lesson_completions: { count: jest.fn(), findAll: jest.fn() },
    enrollments: { findAll: jest.fn() },
    cohorts: {},
    programmes: {},
    weeks: {},
    lessons: {},
  }));
  jest.mock("../../services/StreakService", () => ({
    getStreak: jest.fn().mockResolvedValue({ currentStreak: 0, longestStreak: 0 }),
  }));
  return require("../../services/AchievementService");
}

// ─── isCriteriaMet — pure function, no mocking needed ────────────────────────

describe("AchievementService.isCriteriaMet — boundary tests", () => {
  let service;

  beforeEach(() => {
    service = getService();
  });

  // first_lesson
  describe("first_lesson", () => {
    const criteria = { type: "first_lesson", threshold: 1 };

    test("returns false when totalLessons is 0", () => {
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(false);
    });

    test("returns true when totalLessons is 1 (threshold)", () => {
      expect(service.isCriteriaMet(criteria, { totalLessons: 1, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(true);
    });

    test("returns true when totalLessons > 1", () => {
      expect(service.isCriteriaMet(criteria, { totalLessons: 5, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(true);
    });
  });

  // lessons_completed
  describe("lessons_completed", () => {
    test("returns false at threshold - 1", () => {
      const criteria = { type: "lessons_completed", threshold: 10 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 9, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(false);
    });

    test("returns true at threshold", () => {
      const criteria = { type: "lessons_completed", threshold: 10 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 10, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(true);
    });

    test("returns true above threshold", () => {
      const criteria = { type: "lessons_completed", threshold: 10 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 25, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(true);
    });

    test("returns false when totalLessons is 0 and threshold is 1", () => {
      const criteria = { type: "lessons_completed", threshold: 1 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(false);
    });
  });

  // streak_days
  describe("streak_days", () => {
    test("returns false at threshold - 1", () => {
      const criteria = { type: "streak_days", threshold: 7 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 6, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(false);
    });

    test("returns true at threshold", () => {
      const criteria = { type: "streak_days", threshold: 7 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 7, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(true);
    });

    test("returns true above threshold", () => {
      const criteria = { type: "streak_days", threshold: 7 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 30, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(true);
    });
  });

  // programmes_completed
  describe("programmes_completed", () => {
    test("returns false at threshold - 1", () => {
      const criteria = { type: "programmes_completed", threshold: 1 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 0 })).toBe(false);
    });

    test("returns true at threshold", () => {
      const criteria = { type: "programmes_completed", threshold: 1 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 1, distinctActiveDays: 0 })).toBe(true);
    });

    test("returns false at threshold - 1 for threshold 2", () => {
      const criteria = { type: "programmes_completed", threshold: 2 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 1, distinctActiveDays: 0 })).toBe(false);
    });

    test("returns true at threshold 2", () => {
      const criteria = { type: "programmes_completed", threshold: 2 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 2, distinctActiveDays: 0 })).toBe(true);
    });
  });

  // days_active
  describe("days_active", () => {
    test("returns false at threshold - 1", () => {
      const criteria = { type: "days_active", threshold: 14 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 13 })).toBe(false);
    });

    test("returns true at threshold", () => {
      const criteria = { type: "days_active", threshold: 14 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 14 })).toBe(true);
    });

    test("returns true above threshold", () => {
      const criteria = { type: "days_active", threshold: 14 };
      expect(service.isCriteriaMet(criteria, { totalLessons: 0, currentStreak: 0, completedProgrammes: 0, distinctActiveDays: 30 })).toBe(true);
    });
  });

  // unknown type
  describe("unknown criteria type", () => {
    test("returns false for unknown type", () => {
      expect(service.isCriteriaMet({ type: "unknown_type", threshold: 1 }, { totalLessons: 100, currentStreak: 100, completedProgrammes: 100, distinctActiveDays: 100 })).toBe(false);
    });

    test("returns false for empty type string", () => {
      expect(service.isCriteriaMet({ type: "", threshold: 1 }, { totalLessons: 100, currentStreak: 100, completedProgrammes: 100, distinctActiveDays: 100 })).toBe(false);
    });
  });
});

// ─── awardAchievement — mocked DB ────────────────────────────────────────────

describe("AchievementService.awardAchievement — mocked DB", () => {
  let service;
  let db;

  beforeEach(() => {
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
    service = require("../../services/AchievementService");
    db = require("../../models");
  });

  test("calls findOrCreate with correct user_id and achievement_id", async () => {
    db.user_achievements.findOrCreate.mockResolvedValue([{}, true]);
    await service.awardAchievement(42, "ach-uuid-123");
    expect(db.user_achievements.findOrCreate).toHaveBeenCalledWith({
      where: { user_id: 42, achievement_id: "ach-uuid-123" },
      defaults: { user_id: 42, achievement_id: "ach-uuid-123" },
    });
  });

  test("does not throw when findOrCreate returns existing row (idempotent)", async () => {
    db.user_achievements.findOrCreate.mockResolvedValue([{ id: 1 }, false]);
    await expect(service.awardAchievement(42, "ach-uuid-123")).resolves.not.toThrow();
  });
});

// ─── evaluateAchievements — fault tolerance ───────────────────────────────────

describe("AchievementService.evaluateAchievements — fault tolerance", () => {
  let service;
  let db;
  let StreakService;

  beforeEach(() => {
    jest.resetModules();
    jest.mock("../../models", () => ({
      achievements: { findAll: jest.fn() },
      user_achievements: { findAll: jest.fn(), findOrCreate: jest.fn() },
      lesson_completions: { count: jest.fn(), findAll: jest.fn() },
      enrollments: { findAll: jest.fn() },
    }));
    jest.mock("../../services/StreakService", () => ({
      getStreak: jest.fn().mockResolvedValue({ currentStreak: 5, longestStreak: 10 }),
    }));
    service = require("../../services/AchievementService");
    db = require("../../models");
    StreakService = require("../../services/StreakService");
  });

  test("does not throw when no achievements exist", async () => {
    db.achievements.findAll.mockResolvedValue([]);
    await expect(service.evaluateAchievements(1)).resolves.not.toThrow();
  });

  test("does not throw when achievements fetch fails", async () => {
    db.achievements.findAll.mockRejectedValue(new Error("DB error"));
    await expect(service.evaluateAchievements(1)).resolves.not.toThrow();
  });

  test("does not throw when user_achievements fetch fails", async () => {
    db.achievements.findAll.mockResolvedValue([
      { id: "ach-1", criteria: { type: "first_lesson", threshold: 1 } },
    ]);
    db.user_achievements.findAll.mockRejectedValue(new Error("DB error"));
    await expect(service.evaluateAchievements(1)).resolves.not.toThrow();
  });

  test("continues processing remaining achievements when one errors", async () => {
    const ach1 = { id: "ach-1", criteria: { type: "first_lesson", threshold: 1 } };
    const ach2 = { id: "ach-2", criteria: { type: "lessons_completed", threshold: 5 } };

    db.achievements.findAll.mockResolvedValue([ach1, ach2]);
    db.user_achievements.findAll.mockResolvedValue([]);
    db.lesson_completions.count.mockResolvedValue(10);
    db.lesson_completions.findAll.mockResolvedValue([]);
    db.enrollments.findAll.mockResolvedValue([]);

    // First findOrCreate throws, second succeeds
    db.user_achievements.findOrCreate
      .mockRejectedValueOnce(new Error("Award error for ach-1"))
      .mockResolvedValueOnce([{}, true]);

    await expect(service.evaluateAchievements(1)).resolves.not.toThrow();

    // ach-2 should still have been attempted
    expect(db.user_achievements.findOrCreate).toHaveBeenCalledTimes(2);
  });

  test("skips already-awarded achievements", async () => {
    const ach1 = { id: "ach-1", criteria: { type: "first_lesson", threshold: 1 } };

    db.achievements.findAll.mockResolvedValue([ach1]);
    db.user_achievements.findAll.mockResolvedValue([{ achievement_id: "ach-1" }]);
    db.lesson_completions.count.mockResolvedValue(5);
    db.lesson_completions.findAll.mockResolvedValue([]);
    db.enrollments.findAll.mockResolvedValue([]);

    await service.evaluateAchievements(1);

    // Should not try to award already-awarded achievement
    expect(db.user_achievements.findOrCreate).not.toHaveBeenCalled();
  });

  test("awards achievement when criteria is met", async () => {
    const ach1 = { id: "ach-1", criteria: { type: "first_lesson", threshold: 1 } };

    db.achievements.findAll.mockResolvedValue([ach1]);
    db.user_achievements.findAll.mockResolvedValue([]);
    db.lesson_completions.count.mockResolvedValue(3);
    db.lesson_completions.findAll.mockResolvedValue([]);
    db.enrollments.findAll.mockResolvedValue([]);
    db.user_achievements.findOrCreate.mockResolvedValue([{}, true]);

    await service.evaluateAchievements(1);

    expect(db.user_achievements.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 1, achievement_id: "ach-1" } })
    );
  });

  test("does not award achievement when criteria is not met", async () => {
    const ach1 = { id: "ach-1", criteria: { type: "lessons_completed", threshold: 100 } };

    db.achievements.findAll.mockResolvedValue([ach1]);
    db.user_achievements.findAll.mockResolvedValue([]);
    db.lesson_completions.count.mockResolvedValue(5); // below threshold
    db.lesson_completions.findAll.mockResolvedValue([]);
    db.enrollments.findAll.mockResolvedValue([]);

    await service.evaluateAchievements(1);

    expect(db.user_achievements.findOrCreate).not.toHaveBeenCalled();
  });
});
