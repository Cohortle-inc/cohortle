/**
 * Property-Based Tests for Progress Indicator Updates
 * Feature: mvp-completion-gaps
 * 
 * This test verifies that progress indicators update correctly after lesson completion.
 */

import fc from 'fast-check';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMarkLessonComplete } from '@/lib/hooks/useLessonCompletion';
import { useModuleProgress } from '@/lib/hooks/useProgress';
import * as lessonApi from '@/lib/api/lessons';
import * as programmesApi from '@/lib/api/programmes';

// Mock the API modules
jest.mock('@/lib/api/lessons');
jest.mock('@/lib/api/programmes');

// Create a wrapper with QueryClient for testing
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('Feature: mvp-completion-gaps - Progress Indicator Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 15: Progress Indicator Updates
   * For any lesson completion, all related progress indicators should update 
   * to reflect the new completion state.
   * 
   * This property verifies that:
   * 1. When a lesson is marked complete, the module progress updates
   * 2. The progress percentage reflects the new completion count
   * 3. The completed lessons count increments correctly
   * 4. Progress indicators are invalidated and refetched
   * 
   * **Validates: Requirements 2.8**
   */
  describe('Property 15: Progress Indicator Updates', () => {
    it('should update all progress indicators after any lesson completion', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random module data with lessons
          fc.record({
            moduleId: fc.string({ minLength: 1, maxLength: 20 }),
            moduleName: fc.string({ minLength: 1, maxLength: 50 }),
            lessons: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                isCompleted: fc.boolean(),
              }),
              { minLength: 1, maxLength: 20 } // At least 1 lesson
            ),
          }).chain(module => {
            // Ensure at least one lesson is not completed (so we can complete it)
            const hasIncompleteLesson = module.lessons.some(l => !l.isCompleted);
            if (!hasIncompleteLesson && module.lessons.length > 0) {
              // Make the first lesson incomplete
              module.lessons[0].isCompleted = false;
            }
            return fc.constant(module);
          }),
          fc.string({ minLength: 1, maxLength: 20 }), // cohortId
          async (moduleData, cohortId) => {
            // Find an incomplete lesson to complete
            const incompleteLesson = moduleData.lessons.find(l => !l.isCompleted);
            
            // Skip if no incomplete lessons (shouldn't happen due to generator constraint)
            if (!incompleteLesson) {
              return;
            }

            // Calculate initial progress
            const initialCompletedCount = moduleData.lessons.filter(l => l.isCompleted).length;
            const totalLessons = moduleData.lessons.length;
            const initialProgress = Math.round((initialCompletedCount / totalLessons) * 100);

            // Calculate expected progress after completion
            const expectedCompletedCount = initialCompletedCount + 1;
            const expectedProgress = Math.round((expectedCompletedCount / totalLessons) * 100);

            // Mock the initial module lessons response
            const mockGetModuleLessons = jest.fn().mockResolvedValue({
              module: {
                id: moduleData.moduleId,
                name: moduleData.moduleName,
              },
              data: moduleData.lessons,
            });
            (programmesApi.getModuleLessons as jest.Mock) = mockGetModuleLessons;

            // Mock the mark complete API call
            const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
            (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

            const Wrapper = createWrapper();

            // Render the progress hook to get initial state
            const { result: progressResult } = renderHook(
              () => useModuleProgress(moduleData.moduleId),
              { wrapper: Wrapper }
            );

            // Wait for initial progress to load
            await waitFor(() => {
              expect(progressResult.current.isSuccess).toBe(true);
            });

            // Property: Initial progress should match calculated values
            expect(progressResult.current.data?.completedLessons).toBe(initialCompletedCount);
            expect(progressResult.current.data?.totalLessons).toBe(totalLessons);
            expect(progressResult.current.data?.progressPercentage).toBe(initialProgress);

            // Update the mock to return updated completion state
            const updatedLessons = moduleData.lessons.map(lesson =>
              lesson.id === incompleteLesson.id
                ? { ...lesson, isCompleted: true }
                : lesson
            );
            mockGetModuleLessons.mockResolvedValue({
              module: {
                id: moduleData.moduleId,
                name: moduleData.moduleName,
              },
              data: updatedLessons,
            });

            // Render the completion hook
            const { result: completionResult } = renderHook(
              () => useMarkLessonComplete(),
              { wrapper: Wrapper }
            );

            // Mark the lesson as complete
            await act(async () => {
              completionResult.current.mutate({
                lessonId: incompleteLesson.id,
                cohortId,
              });
            });

            // Wait for the mutation to complete
            await waitFor(() => {
              expect(completionResult.current.isSuccess).toBe(true);
            });

            // Property: API should be called with correct parameters
            expect(mockMarkComplete).toHaveBeenCalledWith(incompleteLesson.id, cohortId);

            // Wait for progress to be refetched and updated
            await waitFor(() => {
              expect(mockGetModuleLessons).toHaveBeenCalledTimes(2); // Initial + refetch
            });

            // Property: Progress indicators should reflect the new completion state
            await waitFor(() => {
              expect(progressResult.current.data?.completedLessons).toBe(expectedCompletedCount);
              expect(progressResult.current.data?.progressPercentage).toBe(expectedProgress);
            });

            // Property: Total lessons should remain unchanged
            expect(progressResult.current.data?.totalLessons).toBe(totalLessons);

            // Property: Progress should never exceed 100%
            expect(progressResult.current.data?.progressPercentage).toBeLessThanOrEqual(100);

            // Property: Completed count should never exceed total
            expect(progressResult.current.data?.completedLessons).toBeLessThanOrEqual(totalLessons);
          }
        ),
        { numRuns: 10 } // Reduced runs due to async nature
      );
    }, 30000); // 30 second timeout for property-based test

    it('should update progress correctly when completing multiple lessons sequentially', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate module with at least 2 incomplete lessons
          fc.record({
            moduleId: fc.string({ minLength: 1, maxLength: 20 }),
            moduleName: fc.string({ minLength: 1, maxLength: 50 }),
            totalLessons: fc.integer({ min: 2, max: 5 }), // Reduced max for faster tests
          }).chain(base =>
            fc.constant({
              ...base,
              lessons: Array.from({ length: base.totalLessons }, (_, i) => ({
                id: `lesson-${i}`,
                name: `Lesson ${i + 1}`,
                isCompleted: false, // All start incomplete
              })),
            })
          ),
          fc.string({ minLength: 1, maxLength: 20 }), // cohortId
          fc.integer({ min: 1, max: 2 }), // Number of lessons to complete (reduced)
          async (moduleData, cohortId, numToComplete) => {
            // Limit completions to available lessons
            const completionsToMake = Math.min(numToComplete, moduleData.lessons.length);
            
            // Mock the mark complete API call
            const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
            (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

            let currentLessons = [...moduleData.lessons];
            
            // Mock the module lessons response
            const mockGetModuleLessons = jest.fn().mockImplementation(() =>
              Promise.resolve({
                module: {
                  id: moduleData.moduleId,
                  name: moduleData.moduleName,
                },
                data: currentLessons,
              })
            );
            (programmesApi.getModuleLessons as jest.Mock) = mockGetModuleLessons;

            const Wrapper = createWrapper();

            // Render the progress hook
            const { result: progressResult } = renderHook(
              () => useModuleProgress(moduleData.moduleId),
              { wrapper: Wrapper }
            );

            // Wait for initial load
            await waitFor(() => {
              expect(progressResult.current.isSuccess).toBe(true);
            });

            // Property: Initial state should show 0% completion
            expect(progressResult.current.data?.completedLessons).toBe(0);
            expect(progressResult.current.data?.progressPercentage).toBe(0);

            // Complete lessons one by one
            for (let i = 0; i < completionsToMake; i++) {
              const lessonToComplete = currentLessons[i];
              
              // Update the lesson state
              currentLessons = currentLessons.map(lesson =>
                lesson.id === lessonToComplete.id
                  ? { ...lesson, isCompleted: true }
                  : lesson
              );

              // Render the completion hook
              const { result: completionResult } = renderHook(
                () => useMarkLessonComplete(),
                { wrapper: Wrapper }
              );

              // Mark the lesson as complete
              await act(async () => {
                completionResult.current.mutate({
                  lessonId: lessonToComplete.id,
                  cohortId,
                });
              });

              // Wait for mutation to complete
              await waitFor(() => {
                expect(completionResult.current.isSuccess).toBe(true);
              });

              // Calculate expected progress
              const expectedCompleted = i + 1;
              const expectedProgress = Math.round(
                (expectedCompleted / moduleData.totalLessons) * 100
              );

              // Wait for progress to update
              await waitFor(() => {
                expect(progressResult.current.data?.completedLessons).toBe(expectedCompleted);
              });

              // Property: Progress should increase monotonically
              expect(progressResult.current.data?.progressPercentage).toBe(expectedProgress);
              
              // Property: Progress should be between 0 and 100
              expect(progressResult.current.data?.progressPercentage).toBeGreaterThanOrEqual(0);
              expect(progressResult.current.data?.progressPercentage).toBeLessThanOrEqual(100);
            }

            // Property: Final progress should match number of completions
            const finalExpectedProgress = Math.round(
              (completionsToMake / moduleData.totalLessons) * 100
            );
            expect(progressResult.current.data?.progressPercentage).toBe(finalExpectedProgress);
          }
        ),
        { numRuns: 20 } // Reduced runs due to multiple async operations
      );
    }, 30000); // 30 second timeout

    it('should handle progress updates when all lessons are completed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            moduleId: fc.string({ minLength: 1, maxLength: 20 }),
            moduleName: fc.string({ minLength: 1, maxLength: 50 }),
            totalLessons: fc.integer({ min: 1, max: 5 }), // Reduced for faster tests
          }).chain(base =>
            fc.constant({
              ...base,
              lessons: Array.from({ length: base.totalLessons }, (_, i) => ({
                id: `lesson-${i}`,
                name: `Lesson ${i + 1}`,
                isCompleted: i < base.totalLessons - 1, // All complete except last
              })),
            })
          ),
          fc.string({ minLength: 1, maxLength: 20 }), // cohortId
          async (moduleData, cohortId) => {
            const lastLesson = moduleData.lessons[moduleData.lessons.length - 1];
            
            // Mock the mark complete API call
            const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
            (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

            // Mock initial state (all but last complete)
            const mockGetModuleLessons = jest.fn().mockResolvedValue({
              module: {
                id: moduleData.moduleId,
                name: moduleData.moduleName,
              },
              data: moduleData.lessons,
            });
            (programmesApi.getModuleLessons as jest.Mock) = mockGetModuleLessons;

            const Wrapper = createWrapper();

            // Render the progress hook
            const { result: progressResult } = renderHook(
              () => useModuleProgress(moduleData.moduleId),
              { wrapper: Wrapper }
            );

            // Wait for initial load
            await waitFor(() => {
              expect(progressResult.current.isSuccess).toBe(true);
            });

            // Property: Initial progress should be almost complete
            const initialCompleted = moduleData.totalLessons - 1;
            expect(progressResult.current.data?.completedLessons).toBe(initialCompleted);

            // Update mock to return all lessons complete
            const updatedLessons = moduleData.lessons.map(lesson => ({
              ...lesson,
              isCompleted: true,
            }));
            mockGetModuleLessons.mockResolvedValue({
              module: {
                id: moduleData.moduleId,
                name: moduleData.moduleName,
              },
              data: updatedLessons,
            });

            // Render the completion hook
            const { result: completionResult } = renderHook(
              () => useMarkLessonComplete(),
              { wrapper: Wrapper }
            );

            // Complete the last lesson
            await act(async () => {
              completionResult.current.mutate({
                lessonId: lastLesson.id,
                cohortId,
              });
            });

            // Wait for mutation to complete
            await waitFor(() => {
              expect(completionResult.current.isSuccess).toBe(true);
            });

            // Wait for progress to update
            await waitFor(() => {
              expect(progressResult.current.data?.completedLessons).toBe(moduleData.totalLessons);
            });

            // Property: Progress should be exactly 100% when all lessons complete
            expect(progressResult.current.data?.progressPercentage).toBe(100);

            // Property: Completed count should equal total count
            expect(progressResult.current.data?.completedLessons).toBe(
              progressResult.current.data?.totalLessons
            );
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout

    it('should maintain progress consistency across cache invalidations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            moduleId: fc.string({ minLength: 1, maxLength: 20 }),
            moduleName: fc.string({ minLength: 1, maxLength: 50 }),
            lessons: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                isCompleted: fc.boolean(),
              }),
              { minLength: 1, maxLength: 5 } // Reduced for faster tests
            ),
          }),
          fc.string({ minLength: 1, maxLength: 20 }), // cohortId
          async (moduleData, cohortId) => {
            // Find an incomplete lesson
            const incompleteLesson = moduleData.lessons.find(l => !l.isCompleted);
            if (!incompleteLesson) {
              // Make first lesson incomplete if all are complete
              moduleData.lessons[0].isCompleted = false;
            }

            const targetLesson = moduleData.lessons.find(l => !l.isCompleted)!;

            // Calculate progress before and after
            const initialCompleted = moduleData.lessons.filter(l => l.isCompleted).length;
            const totalLessons = moduleData.lessons.length;

            // Mock API
            const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
            (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

            let currentLessons = [...moduleData.lessons];
            const mockGetModuleLessons = jest.fn().mockImplementation(() =>
              Promise.resolve({
                module: {
                  id: moduleData.moduleId,
                  name: moduleData.moduleName,
                },
                data: currentLessons,
              })
            );
            (programmesApi.getModuleLessons as jest.Mock) = mockGetModuleLessons;

            const Wrapper = createWrapper();

            // Render progress hook
            const { result: progressResult } = renderHook(
              () => useModuleProgress(moduleData.moduleId),
              { wrapper: Wrapper }
            );

            await waitFor(() => {
              expect(progressResult.current.isSuccess).toBe(true);
            });

            const initialProgress = progressResult.current.data?.progressPercentage;

            // Update lesson state
            currentLessons = currentLessons.map(lesson =>
              lesson.id === targetLesson.id
                ? { ...lesson, isCompleted: true }
                : lesson
            );

            // Complete lesson
            const { result: completionResult } = renderHook(
              () => useMarkLessonComplete(),
              { wrapper: Wrapper }
            );

            await act(async () => {
              completionResult.current.mutate({
                lessonId: targetLesson.id,
                cohortId,
              });
            });

            await waitFor(() => {
              expect(completionResult.current.isSuccess).toBe(true);
            });

            // Wait for progress update
            await waitFor(() => {
              expect(progressResult.current.data?.completedLessons).toBe(initialCompleted + 1);
            });

            const updatedProgress = progressResult.current.data?.progressPercentage;

            // Property: Progress should increase or stay at 100%
            if (initialProgress !== 100) {
              expect(updatedProgress).toBeGreaterThan(initialProgress!);
            } else {
              expect(updatedProgress).toBe(100);
            }

            // Property: Progress calculation should be consistent
            const expectedProgress = Math.round(
              ((initialCompleted + 1) / totalLessons) * 100
            );
            expect(updatedProgress).toBe(expectedProgress);
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });
});
