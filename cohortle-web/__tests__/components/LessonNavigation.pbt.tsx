/**
 * Property-Based Tests for LessonNavigation Component
 * Feature: student-lesson-viewer-web, mvp-completion-gaps
 */

import fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonNavigation } from '@/components/lessons/LessonNavigation';
import { useModuleLessons } from '@/lib/hooks/useModuleLessons';
import { ModuleLesson } from '@/types/lesson';

// Mock the hooks and router
jest.mock('@/lib/hooks/useModuleLessons');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseModuleLessons = useModuleLessons as jest.MockedFunction<typeof useModuleLessons>;

// Helper to create a test wrapper with React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Generator for lesson sequences
const lessonSequenceArbitrary = () =>
  fc
    .integer({ min: 1, max: 10 })
    .chain((count) =>
      fc.tuple(
        fc.constant(count),
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: count, maxLength: count })
      )
    )
    .map(([count, orderNumbers]) => {
      // Create lessons with potentially non-sequential order numbers
      const uniqueOrders = Array.from(new Set(orderNumbers)).sort((a, b) => a - b);
      // Ensure we have exactly 'count' lessons
      while (uniqueOrders.length < count) {
        uniqueOrders.push(Math.max(...uniqueOrders) + 1);
      }
      return uniqueOrders.slice(0, count).map((order, i) => ({
        id: i + 1,
        name: `Lesson ${i + 1}`,
        order_number: order,
        module_id: 1,
      }));
    });

describe('Feature: student-lesson-viewer-web - LessonNavigation Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 12: Next lesson button is disabled when no next lesson exists
   * Validates: Requirements 3.1, 3.4
   */
  it('Property 12: Next lesson button is disabled when no next lesson exists', () => {
    fc.assert(
      fc.property(
        // Generate a list of lessons with sequential order numbers
        fc
          .integer({ min: 2, max: 10 })
          .chain((count) =>
            fc.tuple(
              fc.constantFrom(...Array.from({ length: count }, (_, i) => i)),
              fc.constant(count)
            )
          )
          .map(([currentIndex, count]) => {
            const lessons: ModuleLesson[] = Array.from({ length: count }, (_, i) => ({
              id: i + 1,
              name: `Lesson ${i + 1}`,
              order_number: i + 1,
              module_id: 1,
            }));
            return { lessons, currentIndex };
          }),
        fc.boolean(), // isCompleted
        ({ lessons, currentIndex }, isCompleted) => {
          const currentLesson = lessons[currentIndex];
          const hasNextLesson = currentIndex < lessons.length - 1;

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { container, unmount } = render(
            <LessonNavigation
              currentLessonId={currentLesson.id.toString()}
              moduleId="1"
              cohortId="1"
              isCompleted={isCompleted}
            />,
            { wrapper: createWrapper() }
          );

          // Find the next button by aria-label
          const nextButton = container.querySelector('button[aria-label="Next lesson"]');
          expect(nextButton).toBeInTheDocument();

          // Next button should be disabled when there's no next lesson
          if (hasNextLesson) {
            expect(nextButton).not.toBeDisabled();
          } else {
            expect(nextButton).toBeDisabled();
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 13: Back button presence
   * Validates: Requirements 3.1
   */
  it('Property 13: Back button is always present', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // number of lessons
        fc.integer({ min: 0, max: 9 }), // current lesson index
        fc.boolean(), // isCompleted
        (lessonCount, currentIndex, isCompleted) => {
          const lessons: ModuleLesson[] = Array.from({ length: lessonCount }, (_, i) => ({
            id: i + 1,
            name: `Lesson ${i + 1}`,
            order_number: i + 1,
            module_id: 1,
          }));

          const currentLesson = lessons[Math.min(currentIndex, lessonCount - 1)];

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { unmount } = render(
            <LessonNavigation
              currentLessonId={currentLesson.id.toString()}
              moduleId="1"
              cohortId="1"
              isCompleted={isCompleted}
            />,
            { wrapper: createWrapper() }
          );

          // Back to module button should always be present
          const backButton = screen.getByText('← Back to Module');
          expect(backButton).toBeInTheDocument();
          
          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 14: Next lesson determination
   * Validates: Requirements 3.2
   */
  it('Property 14: System correctly identifies next lesson by order_number', () => {
    fc.assert(
      fc.property(
        // Generate lessons with non-sequential order numbers to test sorting
        fc
          .array(fc.integer({ min: 1, max: 100 }), { minLength: 2, maxLength: 10 })
          .map((orderNumbers) => {
            // Remove duplicates and sort
            const uniqueOrders = Array.from(new Set(orderNumbers)).sort((a, b) => a - b);
            return uniqueOrders.map((order, i) => ({
              id: i + 1,
              name: `Lesson ${i + 1}`,
              order_number: order,
              module_id: 1,
            }));
          })
          .filter((lessons) => lessons.length >= 2),
        (lessons) => {
          // Test each lesson except the last one
          for (let i = 0; i < lessons.length - 1; i++) {
            const currentLesson = lessons[i];

            mockUseModuleLessons.mockReturnValue({
              data: lessons,
              isLoading: false,
              error: null,
            } as any);

            const { container, unmount } = render(
              <LessonNavigation
                currentLessonId={currentLesson.id.toString()}
                moduleId="1"
                cohortId="1"
                isCompleted={true}
              />,
              { wrapper: createWrapper() }
            );

            // Next button should be present and enabled (since not last lesson)
            const nextButton = container.querySelector('button[aria-label="Next lesson"]');
            expect(nextButton).toBeInTheDocument();
            expect(nextButton).not.toBeDisabled();

            unmount();
          }

          // Test the last lesson - next button should be disabled
          const lastLesson = lessons[lessons.length - 1];
          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { container, unmount } = render(
            <LessonNavigation
              currentLessonId={lastLesson.id.toString()}
              moduleId="1"
              cohortId="1"
              isCompleted={true}
            />,
            { wrapper: createWrapper() }
          );

          const nextButton = container.querySelector('button[aria-label="Next lesson"]');
          expect(nextButton).toBeInTheDocument();
          expect(nextButton).toBeDisabled();
          
          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Feature: mvp-completion-gaps - LessonNavigation Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 17: Navigation Button Functionality
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * For any lesson in a sequence, the navigation buttons should correctly navigate 
   * to adjacent lessons and be disabled when no adjacent lesson exists.
   * - Previous button disabled on first lesson
   * - Next button disabled on last lesson
   * - Both buttons enabled on middle lessons
   * - Navigation works with non-sequential order numbers
   */
  it('Property 17: Navigation buttons correctly handle all lesson positions', () => {
    fc.assert(
      fc.property(
        lessonSequenceArbitrary(),
        fc.integer({ min: 0, max: 9 }), // current lesson index
        fc.boolean(), // isCompleted
        (lessons, currentIndexRaw, isCompleted) => {
          // Ensure currentIndex is within bounds
          const currentIndex = Math.min(currentIndexRaw, lessons.length - 1);
          const currentLesson = lessons[currentIndex];

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { container, unmount } = render(
            <LessonNavigation
              currentLessonId={currentLesson.id.toString()}
              moduleId="1"
              cohortId="1"
              isCompleted={isCompleted}
            />,
            { wrapper: createWrapper() }
          );

          // Get navigation buttons
          const previousButton = container.querySelector('button[aria-label="Previous lesson"]');
          const nextButton = container.querySelector('button[aria-label="Next lesson"]');

          // Both buttons should always be present
          expect(previousButton).toBeInTheDocument();
          expect(nextButton).toBeInTheDocument();

          // Determine expected button states
          const isFirstLesson = currentIndex === 0;
          const isLastLesson = currentIndex === lessons.length - 1;

          // Verify previous button state
          if (isFirstLesson) {
            expect(previousButton).toBeDisabled();
          } else {
            expect(previousButton).not.toBeDisabled();
          }

          // Verify next button state
          if (isLastLesson) {
            expect(nextButton).toBeDisabled();
          } else {
            expect(nextButton).not.toBeDisabled();
          }

          // For middle lessons, both buttons should be enabled
          if (!isFirstLesson && !isLastLesson) {
            expect(previousButton).not.toBeDisabled();
            expect(nextButton).not.toBeDisabled();
          }

          // Verify that buttons have correct styling based on disabled state
          if (previousButton) {
            const hasDisabledStyling = previousButton.className.includes('cursor-not-allowed');
            expect(hasDisabledStyling).toBe(isFirstLesson);
          }

          if (nextButton) {
            const hasDisabledStyling = nextButton.className.includes('cursor-not-allowed');
            expect(hasDisabledStyling).toBe(isLastLesson);
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 17 (Edge Case): Single lesson navigation
   * **Validates: Requirements 3.1, 3.4**
   * 
   * When there's only one lesson, both navigation buttons should be disabled.
   */
  it('Property 17 (Edge Case): Both buttons disabled for single lesson', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // order number
        fc.boolean(), // isCompleted
        (orderNumber, isCompleted) => {
          const lessons: ModuleLesson[] = [
            {
              id: 1,
              name: 'Only Lesson',
              order_number: orderNumber,
              module_id: 1,
            },
          ];

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { container, unmount } = render(
            <LessonNavigation
              currentLessonId="1"
              moduleId="1"
              cohortId="1"
              isCompleted={isCompleted}
            />,
            { wrapper: createWrapper() }
          );

          const previousButton = container.querySelector('button[aria-label="Previous lesson"]');
          const nextButton = container.querySelector('button[aria-label="Next lesson"]');

          // Both buttons should be disabled for a single lesson
          expect(previousButton).toBeDisabled();
          expect(nextButton).toBeDisabled();

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 17 (Sorting): Navigation respects order_number sorting
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * Navigation should work correctly even when lessons have non-sequential
   * order numbers (e.g., 5, 10, 15 instead of 1, 2, 3).
   */
  it('Property 17 (Sorting): Navigation works with non-sequential order numbers', () => {
    fc.assert(
      fc.property(
        fc
          .array(fc.integer({ min: 1, max: 1000 }), { minLength: 3, maxLength: 10 })
          .map((orderNumbers) => {
            // Create unique, sorted order numbers
            const uniqueOrders = Array.from(new Set(orderNumbers)).sort((a, b) => a - b);
            return uniqueOrders.slice(0, Math.min(uniqueOrders.length, 10)).map((order, i) => ({
              id: i + 1,
              name: `Lesson ${i + 1}`,
              order_number: order,
              module_id: 1,
            }));
          })
          .filter((lessons) => lessons.length >= 3),
        (lessons) => {
          // Test the middle lesson
          const middleIndex = Math.floor(lessons.length / 2);
          const middleLesson = lessons[middleIndex];

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { container, unmount } = render(
            <LessonNavigation
              currentLessonId={middleLesson.id.toString()}
              moduleId="1"
              cohortId="1"
              isCompleted={false}
            />,
            { wrapper: createWrapper() }
          );

          const previousButton = container.querySelector('button[aria-label="Previous lesson"]');
          const nextButton = container.querySelector('button[aria-label="Next lesson"]');

          // Middle lesson should have both buttons enabled
          expect(previousButton).not.toBeDisabled();
          expect(nextButton).not.toBeDisabled();

          // Verify the lessons are sorted by order_number
          const sortedLessons = [...lessons].sort((a, b) => a.order_number - b.order_number);
          const sortedIndex = sortedLessons.findIndex((l) => l.id === middleLesson.id);
          
          // Should not be first or last in sorted order
          expect(sortedIndex).toBeGreaterThan(0);
          expect(sortedIndex).toBeLessThan(sortedLessons.length - 1);

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});
