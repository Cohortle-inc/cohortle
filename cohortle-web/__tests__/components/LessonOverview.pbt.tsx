/**
 * Property-Based Tests for LessonOverview Component
 * Feature: mvp-completion-gaps
 */

import fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonOverview } from '@/components/lessons/LessonOverview';
import { useModuleLessons } from '@/lib/hooks/useModuleLessons';
import { fetchLessonCompletion } from '@/lib/api/lessons';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/hooks/useModuleLessons');
jest.mock('@/lib/api/lessons');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseModuleLessons = useModuleLessons as jest.MockedFunction<typeof useModuleLessons>;
const mockFetchLessonCompletion = fetchLessonCompletion as jest.MockedFunction<typeof fetchLessonCompletion>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

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

// Generator for lesson data with various configurations
const lessonArbitrary = () =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    order_number: fc.integer({ min: 1, max: 100 }),
    module_id: fc.integer({ min: 1, max: 100 }),
  });

// Generator for lesson arrays with various sizes and configurations
const lessonArrayArbitrary = () =>
  fc
    .array(lessonArbitrary(), { minLength: 1, maxLength: 10 })
    .map((lessons) => {
      // Ensure unique IDs and order numbers
      const uniqueLessons = lessons.map((lesson, index) => ({
        ...lesson,
        id: index + 1,
        order_number: index + 1,
      }));
      return uniqueLessons;
    });

describe('Feature: mvp-completion-gaps - LessonOverview Properties', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPush = jest.fn();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    // Default mock for lesson completion
    mockFetchLessonCompletion.mockResolvedValue({
      lesson_id: 1,
      cohort_id: 1,
      user_id: 1,
      completed: false,
    });
  });

  /**
   * Property 18: Lesson Overview Navigation
   * **Validates: Requirements 3.6**
   * 
   * For any lesson in the overview sidebar, clicking it should navigate to that 
   * specific lesson with the correct cohortId parameter.
   * 
   * This property verifies:
   * - All lessons in the overview are clickable
   * - Clicking navigates to the correct lesson URL
   * - The cohortId is correctly included in the navigation URL
   * - Navigation works for lessons with various IDs, names, and order numbers
   */
  it('Property 18: Clicking any lesson navigates to correct URL with cohortId', async () => {
    await fc.assert(
      fc.asyncProperty(
        lessonArrayArbitrary(),
        fc.integer({ min: 1, max: 100 }), // cohortId
        fc.integer({ min: 0, max: 9 }), // index of lesson to click
        async (lessons, cohortId, clickIndexRaw) => {
          // Ensure click index is within bounds
          const clickIndex = Math.min(clickIndexRaw, lessons.length - 1);
          const lessonToClick = lessons[clickIndex];
          const currentLessonId = lessons[0].id.toString();
          const cohortIdStr = cohortId.toString();

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          // Create a fresh container for each test iteration
          const queryClient = new QueryClient({
            defaultOptions: {
              queries: { retry: false },
            },
          });

          const { unmount, container } = render(
            <QueryClientProvider client={queryClient}>
              <LessonOverview
                currentLessonId={currentLessonId}
                moduleId="1"
                cohortId={cohortIdStr}
              />
            </QueryClientProvider>
          );

          try {
            // Wait for lessons to render
            await waitFor(() => {
              const buttons = container.querySelectorAll('button');
              expect(buttons.length).toBe(lessons.length);
            }, { timeout: 3000 });

            // Find and click the specific lesson button
            const buttons = container.querySelectorAll('button');
            const targetButton = buttons[clickIndex];
            
            const user = userEvent.setup();
            await user.click(targetButton);

            // Verify navigation was called with correct parameters
            expect(mockPush).toHaveBeenCalledTimes(1);
            expect(mockPush).toHaveBeenCalledWith(
              `/lessons/${lessonToClick.id}?cohortId=${cohortIdStr}`
            );
          } finally {
            unmount();
            mockPush.mockClear();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 18 (Edge Case): Navigation works for first lesson
   * **Validates: Requirements 3.6**
   * 
   * Verifies that clicking the first lesson in the overview navigates correctly.
   */
  it('Property 18 (Edge Case): First lesson navigation includes cohortId', async () => {
    await fc.assert(
      fc.asyncProperty(
        lessonArrayArbitrary().filter((lessons) => lessons.length >= 1),
        fc.integer({ min: 1, max: 10000 }), // cohortId
        async (lessons, cohortId) => {
          const firstLesson = lessons[0];
          const cohortIdStr = cohortId.toString();

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { unmount } = render(
            <LessonOverview
              currentLessonId={firstLesson.id.toString()}
              moduleId="1"
              cohortId={cohortIdStr}
            />,
            { wrapper: createWrapper() }
          );

          await waitFor(() => {
            expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
          });

          const buttons = screen.getAllByRole('button');
          const firstButton = buttons[0];

          const user = userEvent.setup();
          await user.click(firstButton);

          // Verify the URL includes both lessonId and cohortId
          expect(mockPush).toHaveBeenCalledWith(
            expect.stringContaining(`/lessons/${firstLesson.id}`)
          );
          expect(mockPush).toHaveBeenCalledWith(
            expect.stringContaining(`cohortId=${cohortIdStr}`)
          );

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 18 (Edge Case): Navigation works for last lesson
   * **Validates: Requirements 3.6**
   * 
   * Verifies that clicking the last lesson in the overview navigates correctly.
   */
  it('Property 18 (Edge Case): Last lesson navigation includes cohortId', async () => {
    await fc.assert(
      fc.asyncProperty(
        lessonArrayArbitrary().filter((lessons) => lessons.length >= 2),
        fc.integer({ min: 1, max: 10000 }), // cohortId
        async (lessons, cohortId) => {
          const lastLesson = lessons[lessons.length - 1];
          const cohortIdStr = cohortId.toString();

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { unmount } = render(
            <LessonOverview
              currentLessonId={lessons[0].id.toString()}
              moduleId="1"
              cohortId={cohortIdStr}
            />,
            { wrapper: createWrapper() }
          );

          await waitFor(() => {
            expect(screen.getAllByRole('button').length).toBe(lessons.length);
          });

          const buttons = screen.getAllByRole('button');
          const lastButton = buttons[buttons.length - 1];

          const user = userEvent.setup();
          await user.click(lastButton);

          // Verify navigation to last lesson with cohortId
          expect(mockPush).toHaveBeenCalledWith(
            `/lessons/${lastLesson.id}?cohortId=${cohortIdStr}`
          );

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 18 (Variation): Navigation works with different lesson names
   * **Validates: Requirements 3.6**
   * 
   * Verifies that navigation works correctly regardless of lesson name content
   * (special characters, long names, short names, etc.).
   */
  it('Property 18 (Variation): Navigation works with various lesson names', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.oneof(
              fc.string({ minLength: 1, maxLength: 5 }), // Short names
              fc.string({ minLength: 50, maxLength: 100 }), // Long names
              fc.constant('Lesson with "quotes"'), // Special characters
              fc.constant('Lesson with <html>'), // HTML-like content
              fc.constant('Lesson with émojis 🎓📚') // Unicode
            ),
            order_number: fc.integer({ min: 1, max: 100 }),
            module_id: fc.constant(1),
          }),
          { minLength: 1, maxLength: 5 }
        ).map((lessons) =>
          lessons.map((lesson, index) => ({
            ...lesson,
            id: index + 1,
            order_number: index + 1,
          }))
        ),
        fc.integer({ min: 1, max: 100 }), // cohortId
        async (lessons, cohortId) => {
          const cohortIdStr = cohortId.toString();

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          const { unmount } = render(
            <LessonOverview
              currentLessonId={lessons[0].id.toString()}
              moduleId="1"
              cohortId={cohortIdStr}
            />,
            { wrapper: createWrapper() }
          );

          await waitFor(() => {
            expect(screen.getAllByRole('button').length).toBe(lessons.length);
          });

          // Click each lesson and verify navigation
          for (let i = 0; i < lessons.length; i++) {
            mockPush.mockClear();
            
            const buttons = screen.getAllByRole('button');
            const user = userEvent.setup();
            await user.click(buttons[i]);

            expect(mockPush).toHaveBeenCalledWith(
              `/lessons/${lessons[i].id}?cohortId=${cohortIdStr}`
            );
          }

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 18 (Consistency): Multiple clicks navigate consistently
   * **Validates: Requirements 3.6**
   * 
   * Verifies that clicking the same lesson multiple times always navigates
   * to the same URL with the same parameters.
   */
  it('Property 18 (Consistency): Multiple clicks to same lesson navigate consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        lessonArrayArbitrary().filter((lessons) => lessons.length >= 1),
        fc.integer({ min: 1, max: 100 }), // cohortId
        fc.integer({ min: 0, max: 9 }), // lesson index to click
        fc.integer({ min: 2, max: 5 }), // number of clicks
        async (lessons, cohortId, clickIndexRaw, numClicks) => {
          const clickIndex = Math.min(clickIndexRaw, lessons.length - 1);
          const lessonToClick = lessons[clickIndex];
          const cohortIdStr = cohortId.toString();
          const expectedUrl = `/lessons/${lessonToClick.id}?cohortId=${cohortIdStr}`;

          mockUseModuleLessons.mockReturnValue({
            data: lessons,
            isLoading: false,
            error: null,
          } as any);

          // Create a fresh container for each test iteration
          const queryClient = new QueryClient({
            defaultOptions: {
              queries: { retry: false },
            },
          });

          const { unmount, container } = render(
            <QueryClientProvider client={queryClient}>
              <LessonOverview
                currentLessonId={lessons[0].id.toString()}
                moduleId="1"
                cohortId={cohortIdStr}
              />
            </QueryClientProvider>
          );

          try {
            await waitFor(() => {
              const buttons = container.querySelectorAll('button');
              expect(buttons.length).toBe(lessons.length);
            }, { timeout: 3000 });

            // Click the same lesson multiple times
            const buttons = container.querySelectorAll('button');
            const targetButton = buttons[clickIndex];

            for (let i = 0; i < numClicks; i++) {
              const user = userEvent.setup();
              await user.click(targetButton);
            }

            // Verify all calls were to the same URL
            expect(mockPush).toHaveBeenCalledTimes(numClicks);
            for (let i = 0; i < numClicks; i++) {
              expect(mockPush).toHaveBeenNthCalledWith(i + 1, expectedUrl);
            }
          } finally {
            unmount();
            mockPush.mockClear();
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
