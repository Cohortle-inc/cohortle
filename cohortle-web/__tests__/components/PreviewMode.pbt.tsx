/**
 * Property-Based Tests for PreviewMode Component
 * Feature: mvp-completion-gaps
 */

import fc from 'fast-check';
import { render, screen, waitFor, within } from '@testing-library/react';
import { PreviewMode } from '@/components/convener/PreviewMode';
import { getWeeks } from '@/lib/api/convener';

// Mock the API
jest.mock('@/lib/api/convener');
const mockGetWeeks = getWeeks as jest.MockedFunction<typeof getWeeks>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock child components
jest.mock('@/components/programmes/ProgrammeHeader', () => ({
  ProgrammeHeader: ({ programme, progress }: any) => (
    <div data-testid="programme-header">
      <h1>{programme.name}</h1>
      <p>{programme.description}</p>
      {progress && <div data-testid="progress">{progress.percentage}%</div>}
    </div>
  ),
}));

jest.mock('@/components/programmes/WeekSection', () => ({
  WeekSection: ({ week }: any) => (
    <div data-testid={`week-${week.id}`}>
      <h2>Week {week.week_number}: {week.title}</h2>
      <div data-testid={`week-${week.id}-lessons`}>
        {week.lessons.map((lesson: any) => (
          <div 
            key={lesson.id} 
            data-testid={`lesson-${lesson.id}`}
            data-completed={lesson.completed}
          >
            {lesson.title}
          </div>
        ))}
      </div>
    </div>
  ),
}));

jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Generators for property-based testing
const alphanumericString = (minLength: number, maxLength: number) =>
  fc.stringMatching(/^[a-zA-Z0-9]+$/).filter(s => s.length >= minLength && s.length <= maxLength);

const lessonArbitrary = () =>
  fc.record({
    id: alphanumericString(1, 20),
    weekId: alphanumericString(1, 20),
    title: alphanumericString(1, 100),
    description: fc.string({ minLength: 0, maxLength: 200 }),
    contentType: fc.constantFrom('text', 'video', 'pdf', 'link', 'quiz', 'live-session'),
    contentUrl: fc.webUrl(),
    orderIndex: fc.integer({ min: 0, max: 100 }),
    createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
    updatedAt: fc.constant('2024-01-01T00:00:00.000Z'),
  });

const weekArbitrary = () =>
  fc.record({
    id: alphanumericString(1, 20),
    programmeId: fc.integer({ min: 1, max: 10000 }),
    weekNumber: fc.integer({ min: 1, max: 52 }),
    title: alphanumericString(1, 100),
    startDate: fc.constant('2024-01-01'),
    createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
    updatedAt: fc.constant('2024-01-01T00:00:00.000Z'),
    lessons: fc.array(lessonArbitrary(), { minLength: 0, maxLength: 10 }),
  });

const programmeDataArbitrary = () =>
  fc.record({
    programmeId: alphanumericString(1, 20),
    programmeName: alphanumericString(1, 100),
    programmeDescription: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    weeks: fc.array(weekArbitrary(), { minLength: 0, maxLength: 10 }).map((weeks, index) => 
      // Ensure unique week IDs to avoid React key warnings
      weeks.map((week, i) => ({ ...week, id: `week-${index}-${i}` }))
    ),
  });

describe('Feature: mvp-completion-gaps - PreviewMode Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the document body to prevent multiple renders
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
  });

  /**
   * Property 26: Preview Mode Functionality
   * **Validates: Requirements 6.2, 6.7, 6.8**
   * 
   * For any convener in preview mode, the system should show learner UI elements 
   * while disabling completion persistence. This property verifies:
   * 
   * 1. Preview mode displays the learner interface (Requirement 6.2)
   * 2. All lessons are shown as incomplete (Requirement 6.7, 6.8)
   * 3. Progress is always 0% (Requirement 6.7, 6.8)
   * 4. Preview mode banner is visible with exit button
   * 5. Programme header displays with correct data
   */
  it('Property 26: Preview mode shows learner interface with disabled completion', async () => {
    await fc.assert(
      fc.asyncProperty(
        programmeDataArbitrary(),
        async ({ programmeId, programmeName, programmeDescription, weeks }) => {
          const mockOnExit = jest.fn();
          
          // Mock API response
          mockGetWeeks.mockResolvedValue(weeks);

          const { container, unmount } = render(
            <PreviewMode
              programmeId={programmeId}
              programmeName={programmeName}
              programmeDescription={programmeDescription}
              onExit={mockOnExit}
            />
          );

          try {
            // Wait for component to load
            await waitFor(
              () => {
                const spinner = container.querySelector('[data-testid="loading-spinner"]');
                expect(spinner).not.toBeInTheDocument();
              },
              { timeout: 3000 }
            );

            // Use within to scope queries to this specific container
            const containerQueries = within(container);

            // 1. Verify preview mode banner is visible
            expect(containerQueries.getByText('Preview Mode')).toBeInTheDocument();
            expect(
              containerQueries.getByText(/You're viewing this programme as a learner would see it/)
            ).toBeInTheDocument();
            expect(containerQueries.getByText('Exit Preview')).toBeInTheDocument();

            // 2. Verify programme header displays with correct data
            expect(containerQueries.getByTestId('programme-header')).toBeInTheDocument();
            expect(containerQueries.getByText(programmeName)).toBeInTheDocument();
            
            if (programmeDescription) {
              expect(containerQueries.getByText(programmeDescription)).toBeInTheDocument();
            }

            // 3. Calculate total lessons across all weeks
            const totalLessons = weeks.reduce((sum, week) => sum + week.lessons.length, 0);

            if (totalLessons > 0) {
              // 4. Verify progress is always 0% (no lessons completed in preview)
              const progressElement = containerQueries.getByTestId('progress');
              expect(progressElement).toHaveTextContent('0%');

              // 5. Verify all lessons are shown as incomplete
              weeks.forEach((week) => {
                week.lessons.forEach((lesson) => {
                  const lessonElement = container.querySelector(`[data-testid="lesson-${lesson.id}"]`);
                  expect(lessonElement).toBeInTheDocument();
                  
                  // Verify lesson is marked as incomplete (completed=false)
                  expect(lessonElement?.getAttribute('data-completed')).toBe('false');
                });
              });

              // 6. Verify weeks are displayed
              weeks.forEach((week) => {
                expect(containerQueries.getByTestId(`week-${week.id}`)).toBeInTheDocument();
              });
            } else if (weeks.length === 0) {
              // If no weeks at all, verify empty state is shown
              expect(
                containerQueries.getByText(/No weeks or lessons available yet/)
              ).toBeInTheDocument();
            } else {
              // If there are weeks but no lessons, weeks should still be displayed
              weeks.forEach((week) => {
                expect(containerQueries.getByTestId(`week-${week.id}`)).toBeInTheDocument();
              });
              
              // Progress should still be 0%
              const progressElement = containerQueries.getByTestId('progress');
              expect(progressElement).toHaveTextContent('0%');
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 26 (Edge Case): Preview mode with empty programme
   * **Validates: Requirements 6.2**
   * 
   * Verifies that preview mode handles programmes with no weeks/lessons gracefully.
   */
  it('Property 26 (Edge Case): Preview mode displays empty state for programmes with no content', async () => {
    await fc.assert(
      fc.asyncProperty(
        alphanumericString(1, 20),
        alphanumericString(1, 100),
        async (programmeId, programmeName) => {
          const mockOnExit = jest.fn();
          
          // Mock API response with empty weeks
          mockGetWeeks.mockResolvedValue([]);

          const { unmount, container } = render(
            <PreviewMode
              programmeId={programmeId}
              programmeName={programmeName}
              onExit={mockOnExit}
            />
          );

          try {
            await waitFor(
              () => {
                const spinner = container.querySelector('[data-testid="loading-spinner"]');
                expect(spinner).not.toBeInTheDocument();
              },
              { timeout: 3000 }
            );

            const containerQueries = within(container);

            // Verify preview mode banner is still visible
            expect(containerQueries.getByText('Preview Mode')).toBeInTheDocument();

            // Verify empty state message
            expect(
              containerQueries.getByText(/No weeks or lessons available yet/)
            ).toBeInTheDocument();
            expect(
              containerQueries.getByText(/Create weeks and add lessons to see them in preview mode/)
            ).toBeInTheDocument();

            // Verify progress is 0% (no lessons to complete)
            expect(containerQueries.getByTestId('progress')).toHaveTextContent('0%');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 26 (Variation): Preview mode with single lesson
   * **Validates: Requirements 6.2, 6.7, 6.8**
   * 
   * Verifies that preview mode works correctly with minimal content (one week, one lesson).
   */
  it('Property 26 (Variation): Preview mode shows single lesson as incomplete', async () => {
    await fc.assert(
      fc.asyncProperty(
        alphanumericString(1, 20),
        alphanumericString(1, 100),
        lessonArbitrary(),
        async (programmeId, programmeName, lesson) => {
          const mockOnExit = jest.fn();
          
          const singleWeek = {
            id: 'week-1',
            programmeId: 123,
            weekNumber: 1,
            title: 'Week 1',
            startDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            lessons: [lesson],
          };

          mockGetWeeks.mockResolvedValue([singleWeek]);

          const { unmount, container } = render(
            <PreviewMode
              programmeId={programmeId}
              programmeName={programmeName}
              onExit={mockOnExit}
            />
          );

          try {
            await waitFor(
              () => {
                const spinner = container.querySelector('[data-testid="loading-spinner"]');
                expect(spinner).not.toBeInTheDocument();
              },
              { timeout: 3000 }
            );

            const containerQueries = within(container);

            // Verify preview mode is active
            expect(containerQueries.getByText('Preview Mode')).toBeInTheDocument();

            // Verify the single lesson is displayed as incomplete
            const lessonElement = container.querySelector(`[data-testid="lesson-${lesson.id}"]`);
            expect(lessonElement).toBeInTheDocument();
            expect(lessonElement?.getAttribute('data-completed')).toBe('false');

            // Verify progress is 0% (1 lesson, 0 completed)
            expect(containerQueries.getByTestId('progress')).toHaveTextContent('0%');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 26 (Consistency): Preview mode always shows 0% progress
   * **Validates: Requirements 6.7, 6.8**
   * 
   * Verifies that no matter how many lessons exist, preview mode always shows 
   * 0% progress because completion actions are disabled.
   */
  it('Property 26 (Consistency): Progress is always 0% in preview mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        programmeDataArbitrary().filter(data => 
          data.weeks.some(week => week.lessons.length > 0)
        ),
        async ({ programmeId, programmeName, programmeDescription, weeks }) => {
          const mockOnExit = jest.fn();
          
          mockGetWeeks.mockResolvedValue(weeks);

          const { unmount, container } = render(
            <PreviewMode
              programmeId={programmeId}
              programmeName={programmeName}
              programmeDescription={programmeDescription}
              onExit={mockOnExit}
            />
          );

          try {
            await waitFor(
              () => {
                const spinner = container.querySelector('[data-testid="loading-spinner"]');
                expect(spinner).not.toBeInTheDocument();
              },
              { timeout: 3000 }
            );

            const containerQueries = within(container);

            // Calculate total lessons
            const totalLessons = weeks.reduce((sum, week) => sum + week.lessons.length, 0);

            // Verify progress is always 0%, never increases
            const progressElement = containerQueries.getByTestId('progress');
            expect(progressElement).toHaveTextContent('0%');
            
            // Verify the text content is exactly "0%", not "1%", "50%", etc.
            expect(progressElement.textContent).toBe('0%');

            // Verify total lessons is greater than 0 (to ensure we're testing with content)
            expect(totalLessons).toBeGreaterThan(0);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 26 (Variation): Preview mode with different content types
   * **Validates: Requirements 6.2**
   * 
   * Verifies that preview mode displays all lesson content types correctly
   * (text, video, pdf, link, quiz, live-session).
   */
  it('Property 26 (Variation): Preview mode displays all lesson content types', async () => {
    await fc.assert(
      fc.asyncProperty(
        alphanumericString(1, 20),
        alphanumericString(1, 100),
        async (programmeId, programmeName) => {
          const mockOnExit = jest.fn();
          
          // Create lessons with all content types
          const contentTypes = ['text', 'video', 'pdf', 'link', 'quiz', 'live-session'] as const;
          const lessons = contentTypes.map((contentType, index) => ({
            id: `lesson-${index}`,
            weekId: 'week-1',
            title: `${contentType} Lesson`,
            description: `A ${contentType} lesson`,
            contentType,
            contentUrl: 'https://example.com',
            orderIndex: index,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }));

          const week = {
            id: 'week-1',
            programmeId: 123,
            weekNumber: 1,
            title: 'Week 1',
            startDate: '2024-01-01',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            lessons,
          };

          mockGetWeeks.mockResolvedValue([week]);

          const { unmount, container } = render(
            <PreviewMode
              programmeId={programmeId}
              programmeName={programmeName}
              onExit={mockOnExit}
            />
          );

          try {
            await waitFor(
              () => {
                const spinner = container.querySelector('[data-testid="loading-spinner"]');
                expect(spinner).not.toBeInTheDocument();
              },
              { timeout: 3000 }
            );

            const containerQueries = within(container);

            // Verify all lesson types are displayed and marked as incomplete
            lessons.forEach((lesson) => {
              const lessonElement = container.querySelector(`[data-testid="lesson-${lesson.id}"]`);
              expect(lessonElement).toBeInTheDocument();
              expect(lessonElement?.getAttribute('data-completed')).toBe('false');
            });

            // Verify progress is 0% with 6 lessons
            expect(containerQueries.getByTestId('progress')).toHaveTextContent('0%');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
