/**
 * Unit tests for progress calculation utilities
 * Tests the core progress calculation functions
 */

import {
  calculateProgressPercentage,
  calculateWeekProgress,
  calculateProgrammeProgress,
  calculateModuleProgress,
  updateProgressAfterCompletion,
  WeekProgress,
  ProgrammeProgress,
} from '@/lib/utils/progressCalculation';

describe('calculateProgressPercentage', () => {
  it('should return 0 when total is 0', () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0);
  });

  it('should return 0 when completed is negative', () => {
    expect(calculateProgressPercentage(-1, 10)).toBe(0);
  });

  it('should return 0 when total is negative', () => {
    expect(calculateProgressPercentage(5, -10)).toBe(0);
  });

  it('should return 100 when completed exceeds total', () => {
    expect(calculateProgressPercentage(15, 10)).toBe(100);
  });

  it('should calculate correct percentage for partial completion', () => {
    expect(calculateProgressPercentage(3, 10)).toBe(30);
    expect(calculateProgressPercentage(5, 10)).toBe(50);
    expect(calculateProgressPercentage(7, 10)).toBe(70);
  });

  it('should round percentage to nearest integer', () => {
    expect(calculateProgressPercentage(1, 3)).toBe(33); // 33.333... -> 33
    expect(calculateProgressPercentage(2, 3)).toBe(67); // 66.666... -> 67
  });

  it('should return 100 when all items are completed', () => {
    expect(calculateProgressPercentage(10, 10)).toBe(100);
  });
});

describe('calculateWeekProgress', () => {
  it('should calculate progress for week with no lessons', () => {
    const result = calculateWeekProgress('week-1', 'Week 1', []);
    
    expect(result).toEqual({
      weekId: 'week-1',
      weekName: 'Week 1',
      totalLessons: 0,
      completedLessons: 0,
      progressPercentage: 0,
    });
  });

  it('should calculate progress for week with all lessons incomplete', () => {
    const lessons = [
      { id: 'lesson-1', isCompleted: false },
      { id: 'lesson-2', isCompleted: false },
      { id: 'lesson-3', isCompleted: false },
    ];
    
    const result = calculateWeekProgress('week-1', 'Week 1', lessons);
    
    expect(result).toEqual({
      weekId: 'week-1',
      weekName: 'Week 1',
      totalLessons: 3,
      completedLessons: 0,
      progressPercentage: 0,
    });
  });

  it('should calculate progress for week with some lessons completed', () => {
    const lessons = [
      { id: 'lesson-1', isCompleted: true },
      { id: 'lesson-2', isCompleted: false },
      { id: 'lesson-3', isCompleted: true },
    ];
    
    const result = calculateWeekProgress('week-1', 'Week 1', lessons);
    
    expect(result).toEqual({
      weekId: 'week-1',
      weekName: 'Week 1',
      totalLessons: 3,
      completedLessons: 2,
      progressPercentage: 67,
    });
  });

  it('should calculate progress for week with all lessons completed', () => {
    const lessons = [
      { id: 'lesson-1', isCompleted: true },
      { id: 'lesson-2', isCompleted: true },
      { id: 'lesson-3', isCompleted: true },
    ];
    
    const result = calculateWeekProgress('week-1', 'Week 1', lessons);
    
    expect(result).toEqual({
      weekId: 'week-1',
      weekName: 'Week 1',
      totalLessons: 3,
      completedLessons: 3,
      progressPercentage: 100,
    });
  });
});

describe('calculateProgrammeProgress', () => {
  it('should calculate progress for programme with no weeks', () => {
    const result = calculateProgrammeProgress('prog-1', 'Programme 1', []);
    
    expect(result).toEqual({
      programmeId: 'prog-1',
      programmeName: 'Programme 1',
      totalLessons: 0,
      completedLessons: 0,
      progressPercentage: 0,
      weeks: [],
    });
  });

  it('should calculate progress for programme with multiple weeks', () => {
    const weeks: WeekProgress[] = [
      {
        weekId: 'week-1',
        weekName: 'Week 1',
        totalLessons: 5,
        completedLessons: 3,
        progressPercentage: 60,
      },
      {
        weekId: 'week-2',
        weekName: 'Week 2',
        totalLessons: 5,
        completedLessons: 2,
        progressPercentage: 40,
      },
    ];
    
    const result = calculateProgrammeProgress('prog-1', 'Programme 1', weeks);
    
    expect(result).toEqual({
      programmeId: 'prog-1',
      programmeName: 'Programme 1',
      totalLessons: 10,
      completedLessons: 5,
      progressPercentage: 50,
      weeks,
    });
  });

  it('should calculate progress for programme with all lessons completed', () => {
    const weeks: WeekProgress[] = [
      {
        weekId: 'week-1',
        weekName: 'Week 1',
        totalLessons: 5,
        completedLessons: 5,
        progressPercentage: 100,
      },
      {
        weekId: 'week-2',
        weekName: 'Week 2',
        totalLessons: 5,
        completedLessons: 5,
        progressPercentage: 100,
      },
    ];
    
    const result = calculateProgrammeProgress('prog-1', 'Programme 1', weeks);
    
    expect(result.progressPercentage).toBe(100);
    expect(result.completedLessons).toBe(10);
    expect(result.totalLessons).toBe(10);
  });
});

describe('calculateModuleProgress', () => {
  it('should calculate progress for module with no lessons', () => {
    const result = calculateModuleProgress('module-1', 'Module 1', []);
    
    expect(result).toEqual({
      moduleId: 'module-1',
      moduleName: 'Module 1',
      totalLessons: 0,
      completedLessons: 0,
      progressPercentage: 0,
    });
  });

  it('should calculate progress for module with some lessons completed', () => {
    const lessons = [
      { id: 'lesson-1', isCompleted: true },
      { id: 'lesson-2', isCompleted: false },
      { id: 'lesson-3', isCompleted: true },
      { id: 'lesson-4', isCompleted: false },
    ];
    
    const result = calculateModuleProgress('module-1', 'Module 1', lessons);
    
    expect(result).toEqual({
      moduleId: 'module-1',
      moduleName: 'Module 1',
      totalLessons: 4,
      completedLessons: 2,
      progressPercentage: 50,
    });
  });
});

describe('updateProgressAfterCompletion', () => {
  it('should update progress when a lesson is completed', () => {
    const currentProgress: ProgrammeProgress = {
      programmeId: 'prog-1',
      programmeName: 'Programme 1',
      totalLessons: 10,
      completedLessons: 5,
      progressPercentage: 50,
      weeks: [
        {
          weekId: 'week-1',
          weekName: 'Week 1',
          totalLessons: 5,
          completedLessons: 3,
          progressPercentage: 60,
        },
        {
          weekId: 'week-2',
          weekName: 'Week 2',
          totalLessons: 5,
          completedLessons: 2,
          progressPercentage: 40,
        },
      ],
    };
    
    const result = updateProgressAfterCompletion(currentProgress, 'week-2', 'lesson-x');
    
    expect(result.completedLessons).toBe(6);
    expect(result.progressPercentage).toBe(60);
    expect(result.weeks[1].completedLessons).toBe(3);
    expect(result.weeks[1].progressPercentage).toBe(60);
  });

  it('should not exceed total lessons when updating', () => {
    const currentProgress: ProgrammeProgress = {
      programmeId: 'prog-1',
      programmeName: 'Programme 1',
      totalLessons: 5,
      completedLessons: 4,
      progressPercentage: 80,
      weeks: [
        {
          weekId: 'week-1',
          weekName: 'Week 1',
          totalLessons: 5,
          completedLessons: 5,
          progressPercentage: 100,
        },
      ],
    };
    
    const result = updateProgressAfterCompletion(currentProgress, 'week-1', 'lesson-x');
    
    // Should not exceed total lessons
    expect(result.weeks[0].completedLessons).toBe(5);
    expect(result.weeks[0].progressPercentage).toBe(100);
  });

  it('should not modify other weeks when updating one week', () => {
    const currentProgress: ProgrammeProgress = {
      programmeId: 'prog-1',
      programmeName: 'Programme 1',
      totalLessons: 10,
      completedLessons: 5,
      progressPercentage: 50,
      weeks: [
        {
          weekId: 'week-1',
          weekName: 'Week 1',
          totalLessons: 5,
          completedLessons: 3,
          progressPercentage: 60,
        },
        {
          weekId: 'week-2',
          weekName: 'Week 2',
          totalLessons: 5,
          completedLessons: 2,
          progressPercentage: 40,
        },
      ],
    };
    
    const result = updateProgressAfterCompletion(currentProgress, 'week-1', 'lesson-x');
    
    // Week 1 should be updated
    expect(result.weeks[0].completedLessons).toBe(4);
    
    // Week 2 should remain unchanged
    expect(result.weeks[1].completedLessons).toBe(2);
    expect(result.weeks[1].progressPercentage).toBe(40);
  });
});
