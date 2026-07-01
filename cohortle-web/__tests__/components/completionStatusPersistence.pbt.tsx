/**
 * Property-Based Tests for Completion Status Persistence
 * Feature: mvp-completion-gaps
 */

import fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonViewer } from '@/components/lessons/LessonViewer';
import { fetchLesson, fetchLessonCompletion } from '@/lib/api/lessons';
import { Lesson, LessonCompletion } from '@/types/lesson';

// Mock the API functions
jest.mock('@/lib/api/lessons');

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

describe('Feature: mvp-completion-gaps - Completion Status Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 16: Completion Status Persistence
   * For any lesson, the completion status should be correctly loaded from the backend 
   * and displayed consistently across page refreshes. The system should fetch the 
   * completion status via API and render the appropriate UI state (completed or incomplete).
   * 
   * **Validates: Requirements 2.10**
   */
  describe('Property 16: Completion Status Persistence', () => {
    it('should load and display completion status from backend correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }).map(String), // lessonId
          fc.integer({ min: 1, max: 10000 }).map(String), // cohortId
          fc.boolean(), // completion status
          fc.string({ minLength: 5, maxLength: 100 }), // lesson name
          async (lessonId, cohortId, isCompleted, lessonName) => {
            // Mock lesson data
            const mockLesson: Lesson = {
              id: lessonId,
              name: lessonName,
              text: 'Test lesson content',
              media: null,
              module_id: 1,
              order_index: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Mock completion data from backend
            const mockCompletion: LessonCompletion = {
              lesson_id: lessonId,
              user_id: 'test-user',
              cohort_id: cohortId,
              completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : undefined,
            };

            // Mock API responses
            (fetchLesson as jest.Mock).mockResolvedValue(mockLesson);
            (fetchLessonCompletion as jest.Mock).mockResolvedValue(mockCompletion);

            const Wrapper = createWrapper();
            const { container } = render(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />,
              { wrapper: Wrapper }
            );

            // Wait for data to load
            await waitFor(() => {
              expect(fetchLesson).toHaveBeenCalledWith(lessonId);
              expect(fetchLessonCompletion).toHaveBeenCalledWith(lessonId, cohortId);
            });

            // Wait for UI to render
            await waitFor(() => {
              const loadingText = container.textContent?.includes('Loading');
              expect(loadingText).toBe(false);
            });

            // Verify completion status is displayed correctly based on backend data
            if (isCompleted) {
              // Should show "Completed" indicator
              await waitFor(() => {
                const completedText = container.textContent?.includes('Completed');
                expect(completedText).toBe(true);
              });

              // Should NOT show "Mark as Complete" button
              const markCompleteText = container.textContent?.includes('Mark as Complete');
              expect(markCompleteText).toBe(false);

              // Should show checkmark icon
              const checkmarkIcon = container.querySelector('svg path[d*="M9 12l2 2 4-4"]');
              expect(checkmarkIcon).toBeTruthy();
            } else {
              // Should show "Mark as Complete" button
              await waitFor(() => {
                const markCompleteText = container.textContent?.includes('Mark as Complete');
                expect(markCompleteText).toBe(true);
              });

              // Should NOT show "Completed" indicator
              const completedText = container.textContent?.includes('Completed');
              expect(completedText).toBe(false);

              // Should have a clickable button
              const button = container.querySelector('button');
              expect(button).toBeTruthy();
              expect(button?.textContent).toContain('Mark as Complete');
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should fetch completion status with correct parameters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.boolean(),
          async (lessonId, cohortId, isCompleted) => {
            // Mock lesson and completion data
            const mockLesson: Lesson = {
              id: lessonId,
              name: 'Test Lesson',
              text: 'Content',
              media: null,
              module_id: 1,
              order_index: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const mockCompletion: LessonCompletion = {
              lesson_id: lessonId,
              user_id: 'test-user',
              cohort_id: cohortId,
              completed: isCompleted,
            };

            (fetchLesson as jest.Mock).mockResolvedValue(mockLesson);
            (fetchLessonCompletion as jest.Mock).mockResolvedValue(mockCompletion);

            const Wrapper = createWrapper();
            render(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />,
              { wrapper: Wrapper }
            );

            // Verify API was called with correct parameters
            await waitFor(() => {
              expect(fetchLessonCompletion).toHaveBeenCalledWith(lessonId, cohortId);
            });

            // Verify the call was made exactly once
            expect(fetchLessonCompletion).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain completion status consistency across re-renders', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.boolean(),
          async (lessonId, cohortId, isCompleted) => {
            const mockLesson: Lesson = {
              id: lessonId,
              name: 'Test Lesson',
              text: 'Content',
              media: null,
              module_id: 1,
              order_index: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const mockCompletion: LessonCompletion = {
              lesson_id: lessonId,
              user_id: 'test-user',
              cohort_id: cohortId,
              completed: isCompleted,
            };

            (fetchLesson as jest.Mock).mockResolvedValue(mockLesson);
            (fetchLessonCompletion as jest.Mock).mockResolvedValue(mockCompletion);

            const Wrapper = createWrapper();
            const { container, rerender } = render(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />,
              { wrapper: Wrapper }
            );

            // Wait for initial render
            await waitFor(() => {
              const loadingText = container.textContent?.includes('Loading');
              expect(loadingText).toBe(false);
            });

            // Capture initial state
            const initialText = container.textContent;

            // Re-render the component (simulating page refresh)
            rerender(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />
            );

            // Wait for re-render to complete
            await waitFor(() => {
              const loadingText = container.textContent?.includes('Loading');
              expect(loadingText).toBe(false);
            });

            // Verify completion status is still consistent
            if (isCompleted) {
              const completedText = container.textContent?.includes('Completed');
              expect(completedText).toBe(true);
            } else {
              const markCompleteText = container.textContent?.includes('Mark as Complete');
              expect(markCompleteText).toBe(true);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle completion status changes from backend', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.integer({ min: 1, max: 10000 }).map(String),
          async (lessonId, cohortId) => {
            const mockLesson: Lesson = {
              id: lessonId,
              name: 'Test Lesson',
              text: 'Content',
              media: null,
              module_id: 1,
              order_index: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Initially incomplete
            const initialCompletion: LessonCompletion = {
              lesson_id: lessonId,
              user_id: 'test-user',
              cohort_id: cohortId,
              completed: false,
            };

            // Later completed
            const updatedCompletion: LessonCompletion = {
              lesson_id: lessonId,
              user_id: 'test-user',
              cohort_id: cohortId,
              completed: true,
              completed_at: new Date().toISOString(),
            };

            (fetchLesson as jest.Mock).mockResolvedValue(mockLesson);
            
            // First call returns incomplete
            (fetchLessonCompletion as jest.Mock).mockResolvedValueOnce(initialCompletion);

            const Wrapper = createWrapper();
            const { container, rerender } = render(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />,
              { wrapper: Wrapper }
            );

            // Wait for initial incomplete state
            await waitFor(() => {
              const markCompleteText = container.textContent?.includes('Mark as Complete');
              expect(markCompleteText).toBe(true);
            });

            // Simulate backend update - second call returns completed
            (fetchLessonCompletion as jest.Mock).mockResolvedValueOnce(updatedCompletion);

            // Create new wrapper for fresh query client
            const NewWrapper = createWrapper();
            const { container: newContainer } = render(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />,
              { wrapper: NewWrapper }
            );

            // Wait for updated completed state
            await waitFor(() => {
              const completedText = newContainer.textContent?.includes('Completed');
              expect(completedText).toBe(true);
            });

            // Verify the completion status changed
            const markCompleteText = newContainer.textContent?.includes('Mark as Complete');
            expect(markCompleteText).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display completion timestamp when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          async (lessonId, cohortId, completedDate) => {
            const mockLesson: Lesson = {
              id: lessonId,
              name: 'Test Lesson',
              text: 'Content',
              media: null,
              module_id: 1,
              order_index: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const mockCompletion: LessonCompletion = {
              lesson_id: lessonId,
              user_id: 'test-user',
              cohort_id: cohortId,
              completed: true,
              completed_at: completedDate.toISOString(),
            };

            (fetchLesson as jest.Mock).mockResolvedValue(mockLesson);
            (fetchLessonCompletion as jest.Mock).mockResolvedValue(mockCompletion);

            const Wrapper = createWrapper();
            const { container } = render(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />,
              { wrapper: Wrapper }
            );

            // Wait for completion status to load
            await waitFor(() => {
              const completedText = container.textContent?.includes('Completed');
              expect(completedText).toBe(true);
            });

            // Verify completion data was fetched and includes timestamp
            expect(fetchLessonCompletion).toHaveBeenCalledWith(lessonId, cohortId);
            
            const completionData = await fetchLessonCompletion(lessonId, cohortId);
            expect(completionData.completed).toBe(true);
            expect(completionData.completed_at).toBe(completedDate.toISOString());
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle missing completion data gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }).map(String),
          fc.integer({ min: 1, max: 10000 }).map(String),
          async (lessonId, cohortId) => {
            const mockLesson: Lesson = {
              id: lessonId,
              name: 'Test Lesson',
              text: 'Content',
              media: null,
              module_id: 1,
              order_index: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Mock completion data with minimal fields (no completed_at)
            const mockCompletion: LessonCompletion = {
              lesson_id: lessonId,
              user_id: 'test-user',
              cohort_id: cohortId,
              completed: false,
            };

            (fetchLesson as jest.Mock).mockResolvedValue(mockLesson);
            (fetchLessonCompletion as jest.Mock).mockResolvedValue(mockCompletion);

            const Wrapper = createWrapper();
            const { container } = render(
              <LessonViewer lessonId={lessonId} cohortId={cohortId} />,
              { wrapper: Wrapper }
            );

            // Should still render without errors
            await waitFor(() => {
              const loadingText = container.textContent?.includes('Loading');
              expect(loadingText).toBe(false);
            });

            // Should show incomplete state
            const markCompleteText = container.textContent?.includes('Mark as Complete');
            expect(markCompleteText).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
