const ProgressService = require('../../services/ProgressService');
const db = require('../../models');
const { Op } = require('sequelize');

// Mock dependencies
jest.mock('../../models');

describe('ProgressService.getLearnerAggregateStats', () => {
  let userId, programmeIds;

  beforeEach(() => {
    userId = 100;
    programmeIds = [10, 11];
    jest.clearAllMocks();
  });

  it('should calculate aggregate stats correctly', async () => {
    db.enrollments.findAll.mockResolvedValue([
      { cohort: { id: 1, programme_id: 10 } },
      { cohort: { id: 2, programme_id: 11 } }
    ]);

    // Mock calculateProgrammeProgress which is called internally
    jest.spyOn(ProgressService, 'calculateProgrammeProgress').mockImplementation((uid, pid, cid) => {
      if (pid === 10) return Promise.resolve({ progress: 100, completedLessons: 10, totalLessons: 10 });
      if (pid === 11) return Promise.resolve({ progress: 50, completedLessons: 5, totalLessons: 10 });
    });

    const stats = await ProgressService.getLearnerAggregateStats(userId, programmeIds);

    expect(stats).toEqual({
      totalProgrammes: 2,
      completedProgrammes: 1,
      totalLessons: 20,
      completedLessons: 15,
      overallCompletionRate: 75
    });
  });

  it('should return zeros if no programmeIds provided', async () => {
    const stats = await ProgressService.getLearnerAggregateStats(userId, []);
    expect(stats.totalProgrammes).toBe(0);
  });

  describe('calculateProgrammeProgress (Dual Model Support)', () => {
    beforeEach(() => {
      // Restore spy if it exists to allow testing the actual method
      if (ProgressService.calculateProgrammeProgress.mockRestore) {
        ProgressService.calculateProgrammeProgress.mockRestore();
      }
    });

    it('should use WLIMP model when weeks exist', async () => {
      db.weeks.findAll.mockResolvedValue([{ id: 'uuid-1' }]);
      db.lessons.findAll.mockResolvedValue([{ id: 'lesson-1' }, { id: 'lesson-2' }]);
      db.lesson_completions.count.mockResolvedValue(1);

      const result = await ProgressService.calculateProgrammeProgress(1, 10, 1);

      expect(result.totalLessons).toBe(2);
      expect(result.completedLessons).toBe(1);
      expect(result.progress).toBe(50);
      expect(db.weeks.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { programme_id: 10 } }));
    });

    it('should fallback to legacy model when no weeks exist but modules do', async () => {
      db.weeks.findAll.mockResolvedValue([]);
      db.programme_modules.findAll.mockResolvedValue([{ id: 500 }]);
      db.module_lessons.findAll.mockResolvedValue([{ id: 999 }]);
      db.lesson_progress.count.mockResolvedValue(1);

      const result = await ProgressService.calculateProgrammeProgress(1, 10, 1);

      expect(result.totalLessons).toBe(1);
      expect(result.completedLessons).toBe(1);
      expect(result.progress).toBe(100);
      expect(db.programme_modules.findAll).toHaveBeenCalled();
      expect(db.lesson_progress.count).toHaveBeenCalled();
    });

    it('should return zeros if no content exists in either model', async () => {
      db.weeks.findAll.mockResolvedValue([]);
      db.programme_modules.findAll.mockResolvedValue([]);

      const result = await ProgressService.calculateProgrammeProgress(1, 10, 1);

      expect(result.totalLessons).toBe(0);
      expect(result.progress).toBe(0);
    });
  });
});
