/**
 * Unit tests for ProgrammeService
 * 
 * Tests the core functionality of programme retrieval, current week calculation,
 * and week filtering.
 */

const ProgrammeService = require('../../services/ProgrammeService');
const db = require('../../models');
const { programmes, cohorts, weeks, lessons } = db;

// Mock the database models
jest.mock('../../models', () => ({
  programmes: {
    findByPk: jest.fn(),
  },
  cohorts: {
    findOne: jest.fn(),
  },
  weeks: {
    findAll: jest.fn(),
  },
  lessons: {},
}));

describe('ProgrammeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProgrammeById', () => {
    it('should retrieve programme by ID', async () => {
      const mockProgramme = {
        id: 1,
        name: 'Test WLIMP Programme',
        description: 'Test programme for unit tests',
        start_date: new Date('2026-01-01'),
        created_at: new Date(),
        updated_at: new Date(),
      };

      programmes.findByPk.mockResolvedValue(mockProgramme);

      const result = await ProgrammeService.getProgrammeById(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test WLIMP Programme');
      expect(result.description).toBe('Test programme for unit tests');
      expect(programmes.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['id', 'name', 'description', 'start_date', 'created_at', 'updated_at'],
      });
    });

    it('should throw 404 error for non-existent programme', async () => {
      programmes.findByPk.mockResolvedValue(null);

      await expect(
        ProgrammeService.getProgrammeById(99999)
      ).rejects.toThrow('Programme not found');
    });
  });

  describe('getCurrentWeek', () => {
    it('should calculate current week based on cohort start date', async () => {
      // Cohort started 14 days ago, so should be in week 3
      const cohortStartDate = new Date();
      cohortStartDate.setDate(cohortStartDate.getDate() - 14);

      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: cohortStartDate,
      };

      cohorts.findOne.mockResolvedValue(mockCohort);

      const currentWeek = await ProgrammeService.getCurrentWeek(1, 1);

      expect(currentWeek).toBe(3);
    });

    it('should return week 1 for programme starting today', async () => {
      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: new Date(),
      };

      cohorts.findOne.mockResolvedValue(mockCohort);

      const currentWeek = await ProgrammeService.getCurrentWeek(1, 1);

      expect(currentWeek).toBe(1);
    });

    it('should return week 1 for programme starting in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: futureDate,
      };

      cohorts.findOne.mockResolvedValue(mockCohort);

      const currentWeek = await ProgrammeService.getCurrentWeek(1, 1);

      expect(currentWeek).toBe(1);
    });

    it('should use first cohort when cohortId not provided', async () => {
      const cohortStartDate = new Date();
      cohortStartDate.setDate(cohortStartDate.getDate() - 7);

      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: cohortStartDate,
      };

      cohorts.findOne.mockResolvedValue(mockCohort);

      const currentWeek = await ProgrammeService.getCurrentWeek(1);

      expect(currentWeek).toBeGreaterThanOrEqual(1);
      expect(cohorts.findOne).toHaveBeenCalledWith({
        where: { programme_id: 1 },
        order: [['start_date', 'ASC']],
      });
    });

    it('should return 1 when no cohort exists', async () => {
      cohorts.findOne.mockResolvedValue(null);

      const currentWeek = await ProgrammeService.getCurrentWeek(1);

      expect(currentWeek).toBe(1);
    });

    it('should return 1 when cohort has no start date', async () => {
      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: null,
      };

      cohorts.findOne.mockResolvedValue(mockCohort);

      const currentWeek = await ProgrammeService.getCurrentWeek(1, 1);

      expect(currentWeek).toBe(1);
    });
  });

  describe('getProgrammeWeeks', () => {
    it('should return weeks with lessons filtered by current week', async () => {
      const cohortStartDate = new Date();
      cohortStartDate.setDate(cohortStartDate.getDate() - 14); // 14 days ago = week 3

      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: cohortStartDate,
      };

      const mockWeeks = [
        {
          id: 'week-1',
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          start_date: cohortStartDate,
          lessons: [
            { id: 'lesson-1-1', title: 'Lesson 1.1', order_index: 1 },
            { id: 'lesson-1-2', title: 'Lesson 1.2', order_index: 2 },
          ],
          toJSON: function() { return { ...this }; },
        },
        {
          id: 'week-2',
          programme_id: 1,
          week_number: 2,
          title: 'Week 2',
          start_date: new Date(cohortStartDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          lessons: [
            { id: 'lesson-2-1', title: 'Lesson 2.1', order_index: 1 },
            { id: 'lesson-2-2', title: 'Lesson 2.2', order_index: 2 },
          ],
          toJSON: function() { return { ...this }; },
        },
        {
          id: 'week-3',
          programme_id: 1,
          week_number: 3,
          title: 'Week 3',
          start_date: new Date(cohortStartDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          lessons: [
            { id: 'lesson-3-1', title: 'Lesson 3.1', order_index: 1 },
            { id: 'lesson-3-2', title: 'Lesson 3.2', order_index: 2 },
          ],
          toJSON: function() { return { ...this }; },
        },
        {
          id: 'week-4',
          programme_id: 1,
          week_number: 4,
          title: 'Week 4',
          start_date: new Date(cohortStartDate.getTime() + 21 * 24 * 60 * 60 * 1000),
          lessons: [
            { id: 'lesson-4-1', title: 'Lesson 4.1', order_index: 1 },
            { id: 'lesson-4-2', title: 'Lesson 4.2', order_index: 2 },
          ],
          toJSON: function() { return { ...this }; },
        },
        {
          id: 'week-5',
          programme_id: 1,
          week_number: 5,
          title: 'Week 5',
          start_date: new Date(cohortStartDate.getTime() + 28 * 24 * 60 * 60 * 1000),
          lessons: [
            { id: 'lesson-5-1', title: 'Lesson 5.1', order_index: 1 },
            { id: 'lesson-5-2', title: 'Lesson 5.2', order_index: 2 },
          ],
          toJSON: function() { return { ...this }; },
        },
      ];

      cohorts.findOne.mockResolvedValue(mockCohort);
      weeks.findAll.mockResolvedValue(mockWeeks);

      const result = await ProgrammeService.getProgrammeWeeks(1, 1);

      // Should return weeks 1, 2, and 3 (current week is 3)
      expect(result).toHaveLength(3);
      expect(result[0].week_number).toBe(1);
      expect(result[1].week_number).toBe(2);
      expect(result[2].week_number).toBe(3);

      // Should not include weeks 4 and 5
      expect(result.find(w => w.week_number === 4)).toBeUndefined();
      expect(result.find(w => w.week_number === 5)).toBeUndefined();
    });

    it('should include lessons for each week', async () => {
      const cohortStartDate = new Date();
      cohortStartDate.setDate(cohortStartDate.getDate() - 14);

      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: cohortStartDate,
      };

      const mockWeeks = [
        {
          id: 'week-1',
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          lessons: [
            { id: 'lesson-1-1', title: 'Lesson 1.1', order_index: 1 },
            { id: 'lesson-1-2', title: 'Lesson 1.2', order_index: 2 },
          ],
          toJSON: function() { return { ...this }; },
        },
      ];

      cohorts.findOne.mockResolvedValue(mockCohort);
      weeks.findAll.mockResolvedValue(mockWeeks);

      const result = await ProgrammeService.getProgrammeWeeks(1, 1);

      // Each week should have 2 lessons
      result.forEach(week => {
        expect(week.lessons).toHaveLength(2);
        expect(week.lessons[0].order_index).toBe(1);
        expect(week.lessons[1].order_index).toBe(2);
      });
    });

    it('should mark current week with isCurrent flag', async () => {
      const cohortStartDate = new Date();
      cohortStartDate.setDate(cohortStartDate.getDate() - 14);

      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: cohortStartDate,
      };

      const mockWeeks = [
        {
          id: 'week-1',
          programme_id: 1,
          week_number: 1,
          title: 'Week 1',
          lessons: [],
          toJSON: function() { return { ...this }; },
        },
        {
          id: 'week-2',
          programme_id: 1,
          week_number: 2,
          title: 'Week 2',
          lessons: [],
          toJSON: function() { return { ...this }; },
        },
        {
          id: 'week-3',
          programme_id: 1,
          week_number: 3,
          title: 'Week 3',
          lessons: [],
          toJSON: function() { return { ...this }; },
        },
      ];

      cohorts.findOne.mockResolvedValue(mockCohort);
      weeks.findAll.mockResolvedValue(mockWeeks);

      const result = await ProgrammeService.getProgrammeWeeks(1, 1);

      // Week 3 should be marked as current
      const currentWeek = result.find(w => w.week_number === 3);
      expect(currentWeek.isCurrent).toBe(true);

      // Other weeks should not be marked as current
      const otherWeeks = result.filter(w => w.week_number !== 3);
      otherWeeks.forEach(week => {
        expect(week.isCurrent).toBe(false);
      });
    });

    it('should return empty array for programme with no weeks', async () => {
      const mockCohort = {
        id: 1,
        programme_id: 1,
        start_date: new Date(),
      };

      cohorts.findOne.mockResolvedValue(mockCohort);
      weeks.findAll.mockResolvedValue([]);

      const result = await ProgrammeService.getProgrammeWeeks(1);

      expect(result).toHaveLength(0);
    });
  });
});
