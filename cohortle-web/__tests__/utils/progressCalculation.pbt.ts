/**
 * Property-Based Tests for Progress Calculation
 * Feature: mvp-completion-gaps
 */

import fc from 'fast-check';
import {
  calculateProgressPercentage,
  calculateWeekProgress,
  calculateProgrammeProgress,
  WeekProgress,
} from '@/lib/utils/progressCalculation';

describe('Feature: mvp-completion-gaps - Progress Calculation Properties', () => {
  /**
   * Property 14: Progress Calculation Accuracy
   * For any programme or week, the displayed progress percentage should equal 
   * (completed lessons / total lessons) * 100, rounded to the nearest integer.
   * This property verifies that progress calculations are mathematically accurate
   * across many random inputs for both programmes and weeks.
   * 
   * **Validates: Requirements 2.5, 2.6**
   */
  describe('Property 14: Progress Calculation Accuracy', () => {
    it('should calculate correct percentage for any valid completed/total combination', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // completed
          fc.integer({ min: 0, max: 1000 }), // total
          (completed, total) => {
            const result = calculateProgressPercentage(completed, total);
            
            // Property: Result should always be between 0 and 100
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(100);
            
            // Property: When total is 0, result should be 0
            if (total === 0) {
              expect(result).toBe(0);
            }
            
            // Property: When completed is 0, result should be 0
            if (completed === 0 && total > 0) {
              expect(result).toBe(0);
            }
            
            // Property: When completed equals total, result should be 100
            if (completed === total && total > 0) {
              expect(result).toBe(100);
            }
            
            // Property: When completed > total, result should be capped at 100
            if (completed > total && total > 0) {
              expect(result).toBe(100);
            }
            
            // Property: Result should equal (completed / total) * 100, rounded
            if (total > 0 && completed <= total) {
              const expected = Math.round((completed / total) * 100);
              expect(result).toBe(expected);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should calculate accurate week progress for any lesson completion state', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }), // weekId
          fc.string({ minLength: 1, maxLength: 50 }), // weekName
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              isCompleted: fc.boolean(),
            }),
            { minLength: 0, maxLength: 100 }
          ), // lessons
          (weekId, weekName, lessons) => {
            const result = calculateWeekProgress(weekId, weekName, lessons);
            
            // Property: Total lessons should match input array length
            expect(result.totalLessons).toBe(lessons.length);
            
            // Property: Completed lessons should match count of completed items
            const expectedCompleted = lessons.filter(l => l.isCompleted).length;
            expect(result.completedLessons).toBe(expectedCompleted);
            
            // Property: Progress percentage should be accurate
            const expectedPercentage = lessons.length === 0 
              ? 0 
              : Math.round((expectedCompleted / lessons.length) * 100);
            expect(result.progressPercentage).toBe(expectedPercentage);
            
            // Property: Week ID and name should be preserved
            expect(result.weekId).toBe(weekId);
            expect(result.weekName).toBe(weekName);
            
            // Property: Completed should never exceed total
            expect(result.completedLessons).toBeLessThanOrEqual(result.totalLessons);
            
            // Property: Progress should be between 0 and 100
            expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
            expect(result.progressPercentage).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should calculate accurate programme progress from week data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }), // programmeId
          fc.string({ minLength: 1, maxLength: 50 }), // programmeName
          fc.array(
            fc.record({
              weekId: fc.string({ minLength: 1, maxLength: 20 }),
              weekName: fc.string({ minLength: 1, maxLength: 50 }),
              totalLessons: fc.integer({ min: 0, max: 50 }),
              completedLessons: fc.integer({ min: 0, max: 50 }),
              progressPercentage: fc.integer({ min: 0, max: 100 }),
            }).chain(week => 
              // Ensure completedLessons doesn't exceed totalLessons
              fc.constant({
                ...week,
                completedLessons: Math.min(week.completedLessons, week.totalLessons),
              })
            ),
            { minLength: 0, maxLength: 20 }
          ), // weeks
          (programmeId, programmeName, weeks) => {
            const result = calculateProgrammeProgress(programmeId, programmeName, weeks);
            
            // Property: Total lessons should be sum of all week totals
            const expectedTotal = weeks.reduce((sum, week) => sum + week.totalLessons, 0);
            expect(result.totalLessons).toBe(expectedTotal);
            
            // Property: Completed lessons should be sum of all week completed
            const expectedCompleted = weeks.reduce((sum, week) => sum + week.completedLessons, 0);
            expect(result.completedLessons).toBe(expectedCompleted);
            
            // Property: Progress percentage should be accurate
            const expectedPercentage = expectedTotal === 0 
              ? 0 
              : Math.round((expectedCompleted / expectedTotal) * 100);
            expect(result.progressPercentage).toBe(expectedPercentage);
            
            // Property: Programme ID and name should be preserved
            expect(result.programmeId).toBe(programmeId);
            expect(result.programmeName).toBe(programmeName);
            
            // Property: Weeks array should be preserved
            expect(result.weeks).toEqual(weeks);
            
            // Property: Completed should never exceed total
            expect(result.completedLessons).toBeLessThanOrEqual(result.totalLessons);
            
            // Property: Progress should be between 0 and 100
            expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
            expect(result.progressPercentage).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain accuracy with edge cases (empty, full, partial)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalLessons
          fc.double({ min: 0, max: 1 }), // completionRatio
          (totalLessons, completionRatio) => {
            const completedLessons = Math.floor(totalLessons * completionRatio);
            
            const result = calculateProgressPercentage(completedLessons, totalLessons);
            
            // Property: Result should match manual calculation
            const expected = Math.round((completedLessons / totalLessons) * 100);
            expect(result).toBe(expected);
            
            // Property: 0% completion should give 0
            if (completedLessons === 0) {
              expect(result).toBe(0);
            }
            
            // Property: 100% completion should give 100
            if (completedLessons === totalLessons) {
              expect(result).toBe(100);
            }
            
            // Property: Partial completion should be between 0 and 100
            if (completedLessons > 0 && completedLessons < totalLessons) {
              expect(result).toBeGreaterThan(0);
              expect(result).toBeLessThan(100);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle rounding correctly for fractional percentages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // total
          fc.integer({ min: 0, max: 100 }), // completed (will be constrained)
          (total, completed) => {
            // Ensure completed doesn't exceed total
            const actualCompleted = Math.min(completed, total);
            
            const result = calculateProgressPercentage(actualCompleted, total);
            
            // Property: Result should be an integer
            expect(Number.isInteger(result)).toBe(true);
            
            // Property: Result should be the rounded value
            const exactPercentage = (actualCompleted / total) * 100;
            const expected = Math.round(exactPercentage);
            expect(result).toBe(expected);
            
            // Property: Rounding should be within 0.5 of exact value
            const difference = Math.abs(result - exactPercentage);
            expect(difference).toBeLessThanOrEqual(0.5);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should calculate consistent progress across nested structures', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              weekId: fc.string({ minLength: 1, maxLength: 10 }),
              weekName: fc.string({ minLength: 1, maxLength: 20 }),
              lessons: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1, maxLength: 10 }),
                  isCompleted: fc.boolean(),
                }),
                { minLength: 0, maxLength: 20 }
              ),
            }),
            { minLength: 0, maxLength: 10 }
          ), // weeks with lessons
          (weeksWithLessons) => {
            // Calculate week progress for each week
            const weekProgresses: WeekProgress[] = weeksWithLessons.map(week =>
              calculateWeekProgress(week.weekId, week.weekName, week.lessons)
            );
            
            // Calculate programme progress from week progresses
            const programmeProgress = calculateProgrammeProgress(
              'test-prog',
              'Test Programme',
              weekProgresses
            );
            
            // Property: Programme total should equal sum of all lessons across all weeks
            const expectedTotal = weeksWithLessons.reduce(
              (sum, week) => sum + week.lessons.length,
              0
            );
            expect(programmeProgress.totalLessons).toBe(expectedTotal);
            
            // Property: Programme completed should equal sum of all completed lessons
            const expectedCompleted = weeksWithLessons.reduce(
              (sum, week) => sum + week.lessons.filter(l => l.isCompleted).length,
              0
            );
            expect(programmeProgress.completedLessons).toBe(expectedCompleted);
            
            // Property: Programme percentage should match direct calculation
            const expectedPercentage = expectedTotal === 0
              ? 0
              : Math.round((expectedCompleted / expectedTotal) * 100);
            expect(programmeProgress.progressPercentage).toBe(expectedPercentage);
            
            // Property: Each week's progress should be accurate
            weekProgresses.forEach((weekProgress, index) => {
              const originalWeek = weeksWithLessons[index];
              const weekCompleted = originalWeek.lessons.filter(l => l.isCompleted).length;
              const weekTotal = originalWeek.lessons.length;
              const weekPercentage = weekTotal === 0 
                ? 0 
                : Math.round((weekCompleted / weekTotal) * 100);
              
              expect(weekProgress.completedLessons).toBe(weekCompleted);
              expect(weekProgress.totalLessons).toBe(weekTotal);
              expect(weekProgress.progressPercentage).toBe(weekPercentage);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
