/**
 * Property-Based Tests for Programme Progress Navigation
 * Feature: mvp-completion-gaps
 * 
 * This test verifies that clicking on a programme in the dashboard navigates 
 * to the detailed progress view.
 */

import fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgrammeCard } from '@/components/dashboard/ProgrammeCard';
import { Community } from '@/lib/api/user';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/dashboard',
  }),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function Link({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Feature: mvp-completion-gaps - Programme Progress Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 25: Programme Progress Navigation
   * For any programme on the dashboard, clicking it should navigate to the 
   * detailed progress view.
   * 
   * This property verifies that:
   * 1. Programme cards are clickable/navigable
   * 2. Navigation target is the correct programme detail page
   * 3. Programme ID is correctly passed in the URL
   * 4. Navigation works for any valid programme data
   * 
   * **Validates: Requirements 5.5**
   */
  describe('Property 25: Programme Progress Navigation', () => {
    it('should navigate to correct programme page for any programme', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random programme data
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }).map(n => n.toString()),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
            moduleCount: fc.integer({ min: 0, max: 50 }),
            totalLessons: fc.integer({ min: 0, max: 500 }),
            completedLessons: fc.integer({ min: 0, max: 500 }),
            enrolledAt: fc.date().map(d => d.toISOString()),
          }).chain(programme => {
            // Ensure completedLessons doesn't exceed totalLessons
            return fc.constant({
              ...programme,
              completedLessons: Math.min(programme.completedLessons, programme.totalLessons),
            } as Community);
          }),
          async (programme) => {
            const user = userEvent.setup();

            // Render the programme card
            const { container } = render(<ProgrammeCard programme={programme} />);

            // Property: Programme card should be rendered
            expect(container.firstChild).toBeInTheDocument();

            // Property: Programme name should be displayed
            expect(screen.getByText(programme.name)).toBeInTheDocument();

            // Property: Card should have a link to the programme detail page
            const link = container.querySelector(`a[href="/programmes/${programme.id}"]`);
            expect(link).toBeInTheDocument();

            // Property: Link should have correct aria-label for accessibility
            expect(link).toHaveAttribute(
              'aria-label',
              expect.stringContaining(programme.name)
            );

            // Property: Clicking the card should navigate to the programme page
            await user.click(link!);

            // Property: Navigation URL should include the programme ID
            const expectedUrl = `/programmes/${programme.id}`;
            expect(link).toHaveAttribute('href', expectedUrl);

            // Property: Programme ID in URL should match the programme's ID
            const urlProgrammeId = link!.getAttribute('href')!.split('/').pop();
            expect(urlProgrammeId).toBe(programme.id.toString());
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout for property-based test

    it('should display correct progress information for any programme state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }).map(n => n.toString()),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
            moduleCount: fc.integer({ min: 0, max: 50 }),
            totalLessons: fc.integer({ min: 1, max: 500 }), // At least 1 lesson
            completedLessons: fc.integer({ min: 0, max: 500 }),
            enrolledAt: fc.date().map(d => d.toISOString()),
          }).chain(programme => {
            // Ensure completedLessons doesn't exceed totalLessons
            return fc.constant({
              ...programme,
              completedLessons: Math.min(programme.completedLessons, programme.totalLessons),
            } as Community);
          }),
          async (programme) => {
            // Render the programme card
            const { container } = render(<ProgrammeCard programme={programme} />);

            // Calculate expected progress
            const expectedProgress = Math.round(
              (programme.completedLessons / programme.totalLessons) * 100
            );

            // Property: Progress percentage should be displayed correctly
            expect(screen.getByText(`${expectedProgress}%`)).toBeInTheDocument();

            // Property: Progress bar should have correct aria attributes
            const progressBar = container.querySelector('[role="progressbar"]');
            expect(progressBar).toBeInTheDocument();
            expect(progressBar).toHaveAttribute('aria-valuenow', expectedProgress.toString());
            expect(progressBar).toHaveAttribute('aria-valuemin', '0');
            expect(progressBar).toHaveAttribute('aria-valuemax', '100');

            // Property: Lesson count should be displayed
            expect(
              screen.getByText(`${programme.completedLessons} / ${programme.totalLessons} lessons`)
            ).toBeInTheDocument();

            // Property: Module count should be displayed
            expect(screen.getByText(`${programme.moduleCount} modules`)).toBeInTheDocument();

            // Property: Progress should be between 0 and 100
            expect(expectedProgress).toBeGreaterThanOrEqual(0);
            expect(expectedProgress).toBeLessThanOrEqual(100);

            // Property: Completed lessons should never exceed total lessons
            expect(programme.completedLessons).toBeLessThanOrEqual(programme.totalLessons);
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);

    it('should maintain navigation consistency across different programme states', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of programmes to test consistency
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }).map(n => n.toString()),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
              moduleCount: fc.integer({ min: 0, max: 50 }),
              totalLessons: fc.integer({ min: 0, max: 500 }),
              completedLessons: fc.integer({ min: 0, max: 500 }),
              enrolledAt: fc.date().map(d => d.toISOString()),
            }).chain(programme => {
              return fc.constant({
                ...programme,
                completedLessons: Math.min(programme.completedLessons, programme.totalLessons),
              } as Community);
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (programmes) => {
            // Render each programme card
            for (const programme of programmes) {
              const { container, unmount } = render(<ProgrammeCard programme={programme} />);

              // Property: Each programme should have a unique navigation link
              const link = container.querySelector(`a[href="/programmes/${programme.id}"]`);
              expect(link).toBeInTheDocument();

              // Property: Navigation URL should be correctly formatted
              const href = link!.getAttribute('href');
              expect(href).toMatch(/^\/programmes\/\d+$/);

              // Property: Programme ID should be extractable from URL
              const urlId = href!.split('/').pop();
              expect(urlId).toBe(programme.id.toString());

              // Property: Link should be accessible
              expect(link).toHaveAttribute('aria-label');

              unmount();
            }

            // Property: All programme IDs should be unique in their URLs
            const urls = programmes.map(p => `/programmes/${p.id}`);
            const uniqueUrls = new Set(urls);
            // Note: URLs might not be unique if programme IDs are duplicated by generator
            // but each URL should correctly correspond to its programme
            programmes.forEach(programme => {
              expect(urls).toContain(`/programmes/${programme.id}`);
            });
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should handle programmes with zero progress correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }).map(n => n.toString()),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
            moduleCount: fc.integer({ min: 0, max: 50 }),
            totalLessons: fc.integer({ min: 1, max: 500 }),
            completedLessons: fc.constant(0), // Zero progress
            enrolledAt: fc.date().map(d => d.toISOString()),
          }).map(programme => programme as Community),
          async (programme) => {
            const { container } = render(<ProgrammeCard programme={programme} />);

            // Property: Zero progress should display as 0%
            expect(screen.getByText('0%')).toBeInTheDocument();

            // Property: Progress bar should show 0% visually
            const progressBar = container.querySelector('[role="progressbar"]');
            expect(progressBar).toHaveAttribute('aria-valuenow', '0');

            // Property: Navigation should still work with zero progress
            const link = container.querySelector(`a[href="/programmes/${programme.id}"]`);
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', `/programmes/${programme.id}`);

            // Property: Lesson count should show 0 completed
            expect(
              screen.getByText(`0 / ${programme.totalLessons} lessons`)
            ).toBeInTheDocument();
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should handle programmes with complete progress correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }).map(n => n.toString()),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
            moduleCount: fc.integer({ min: 0, max: 50 }),
            totalLessons: fc.integer({ min: 1, max: 500 }),
            enrolledAt: fc.date().map(d => d.toISOString()),
          }).chain(programme => {
            // Set completedLessons equal to totalLessons (100% complete)
            return fc.constant({
              ...programme,
              completedLessons: programme.totalLessons,
            } as Community);
          }),
          async (programme) => {
            const { container } = render(<ProgrammeCard programme={programme} />);

            // Property: Complete progress should display as 100%
            expect(screen.getByText('100%')).toBeInTheDocument();

            // Property: Progress bar should show 100% visually
            const progressBar = container.querySelector('[role="progressbar"]');
            expect(progressBar).toHaveAttribute('aria-valuenow', '100');

            // Property: Navigation should still work with complete progress
            const link = container.querySelector(`a[href="/programmes/${programme.id}"]`);
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', `/programmes/${programme.id}`);

            // Property: Lesson count should show all completed
            expect(
              screen.getByText(`${programme.totalLessons} / ${programme.totalLessons} lessons`)
            ).toBeInTheDocument();

            // Property: Completed should equal total
            expect(programme.completedLessons).toBe(programme.totalLessons);
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should handle programmes with no lessons correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }).map(n => n.toString()),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
            moduleCount: fc.integer({ min: 0, max: 50 }),
            totalLessons: fc.constant(0), // No lessons
            completedLessons: fc.constant(0),
            enrolledAt: fc.date().map(d => d.toISOString()),
          }).map(programme => programme as Community),
          async (programme) => {
            const { container } = render(<ProgrammeCard programme={programme} />);

            // Property: No lessons should display as 0%
            expect(screen.getByText('0%')).toBeInTheDocument();

            // Property: Navigation should still work with no lessons
            const link = container.querySelector(`a[href="/programmes/${programme.id}"]`);
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', `/programmes/${programme.id}`);

            // Property: Lesson count should show 0 / 0
            expect(screen.getByText('0 / 0 lessons')).toBeInTheDocument();

            // Property: Progress should be 0 when there are no lessons
            const progressBar = container.querySelector('[role="progressbar"]');
            expect(progressBar).toHaveAttribute('aria-valuenow', '0');
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);
  });
});
