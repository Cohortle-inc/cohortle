/**
 * Property-based tests for LessonBreadcrumb component
 * Feature: mvp-completion-gaps
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fc from 'fast-check';
import { LessonBreadcrumb } from '@/components/lessons/LessonBreadcrumb';
import apiClient from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Feature: mvp-completion-gaps - LessonBreadcrumb Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 20: Breadcrumb Navigation
   * Validates: Requirements 3.9, 3.10
   * 
   * For any lesson page, breadcrumbs should show the correct hierarchy 
   * (Programme > Week > Lesson or Programme > Lesson) with functional 
   * navigation links.
   */
  it('Property 20: Breadcrumb Navigation - Programme > Week > Lesson hierarchy', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random IDs and names
        fc.record({
          lessonId: fc.integer({ min: 1, max: 10000 }).map(String),
          lessonName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          moduleId: fc.integer({ min: 1, max: 1000 }).map(String),
          moduleName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          cohortId: fc.integer({ min: 1, max: 100 }).map(String),
          programmeId: fc.integer({ min: 1, max: 500 }),
          programmeName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          weekId: fc.integer({ min: 1, max: 200 }),
          weekName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
        }),
        async ({ lessonId, lessonName, moduleId, moduleName, cohortId, programmeId, programmeName, weekId, weekName }) => {
          // Mock API responses for module with week
          (apiClient.get as jest.Mock).mockImplementation((url: string) => {
            if (url === `/api/modules/${moduleId}`) {
              return Promise.resolve({
                data: {
                  id: parseInt(moduleId),
                  name: moduleName,
                  programme_id: programmeId,
                  week_id: weekId,
                },
              });
            }
            if (url === `/api/programmes/${programmeId}`) {
              return Promise.resolve({
                data: {
                  id: programmeId,
                  name: programmeName,
                },
              });
            }
            if (url === `/api/weeks/${weekId}`) {
              return Promise.resolve({
                data: {
                  id: weekId,
                  name: weekName,
                },
              });
            }
            return Promise.reject(new Error('Not found'));
          });

          render(
            <LessonBreadcrumb
              lessonId={lessonId}
              lessonName={lessonName}
              moduleId={moduleId}
              cohortId={cohortId}
            />,
            { wrapper: createWrapper() }
          );

          // Wait for all data to load
          await screen.findByText(programmeName, {}, { timeout: 3000 });

          // Verify Dashboard link exists and is functional
          const dashboardLink = screen.getByText('Dashboard').closest('a');
          expect(dashboardLink).toBeInTheDocument();
          expect(dashboardLink).toHaveAttribute('href', '/dashboard');

          // Verify Programme link exists and is functional
          const programmeLink = screen.getByText(programmeName).closest('a');
          expect(programmeLink).toBeInTheDocument();
          expect(programmeLink).toHaveAttribute('href', `/programmes/${programmeId}`);

          // Verify Week link exists and is functional
          const weekLink = screen.getByText(weekName).closest('a');
          expect(weekLink).toBeInTheDocument();
          expect(weekLink).toHaveAttribute('href', `/programmes/${programmeId}?week=${weekId}`);

          // Verify current lesson is displayed as non-clickable text
          const lessonText = screen.getByText(lessonName);
          expect(lessonText).toBeInTheDocument();
          expect(lessonText.closest('a')).toBeNull(); // Should not be a link

          // Verify correct hierarchy order in DOM
          const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
          const breadcrumbText = breadcrumbNav.textContent || '';
          
          // Check that elements appear in correct order
          const dashboardIndex = breadcrumbText.indexOf('Dashboard');
          const programmeIndex = breadcrumbText.indexOf(programmeName);
          const weekIndex = breadcrumbText.indexOf(weekName);
          const lessonIndex = breadcrumbText.indexOf(lessonName);

          expect(dashboardIndex).toBeLessThan(programmeIndex);
          expect(programmeIndex).toBeLessThan(weekIndex);
          expect(weekIndex).toBeLessThan(lessonIndex);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout

  /**
   * Property 20: Breadcrumb Navigation - Programme > Lesson hierarchy (no week)
   * Validates: Requirements 3.9, 3.10
   * 
   * For lessons not associated with a week, breadcrumbs should show 
   * Programme > Lesson hierarchy with functional navigation links.
   */
  it('Property 20: Breadcrumb Navigation - Programme > Lesson hierarchy without week', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lessonId: fc.integer({ min: 1, max: 10000 }).map(String),
          lessonName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          moduleId: fc.integer({ min: 1, max: 1000 }).map(String),
          moduleName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          cohortId: fc.integer({ min: 1, max: 100 }).map(String),
          programmeId: fc.integer({ min: 1, max: 500 }),
          programmeName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
        }),
        async ({ lessonId, lessonName, moduleId, moduleName, cohortId, programmeId, programmeName }) => {
          // Mock API responses for module without week
          (apiClient.get as jest.Mock).mockImplementation((url: string) => {
            if (url === `/api/modules/${moduleId}`) {
              return Promise.resolve({
                data: {
                  id: parseInt(moduleId),
                  name: moduleName,
                  programme_id: programmeId,
                  week_id: null, // No week
                },
              });
            }
            if (url === `/api/programmes/${programmeId}`) {
              return Promise.resolve({
                data: {
                  id: programmeId,
                  name: programmeName,
                },
              });
            }
            return Promise.reject(new Error('Not found'));
          });

          render(
            <LessonBreadcrumb
              lessonId={lessonId}
              lessonName={lessonName}
              moduleId={moduleId}
              cohortId={cohortId}
            />,
            { wrapper: createWrapper() }
          );

          // Wait for data to load
          await screen.findByText(programmeName, {}, { timeout: 3000 });

          // Verify Dashboard link
          const dashboardLink = screen.getByText('Dashboard').closest('a');
          expect(dashboardLink).toBeInTheDocument();
          expect(dashboardLink).toHaveAttribute('href', '/dashboard');

          // Verify Programme link
          const programmeLink = screen.getByText(programmeName).closest('a');
          expect(programmeLink).toBeInTheDocument();
          expect(programmeLink).toHaveAttribute('href', `/programmes/${programmeId}`);

          // Verify Module link (shown when no week)
          const moduleLink = screen.getByText(moduleName).closest('a');
          expect(moduleLink).toBeInTheDocument();
          expect(moduleLink).toHaveAttribute('href', `/modules/${moduleId}`);

          // Verify current lesson is non-clickable
          const lessonText = screen.getByText(lessonName);
          expect(lessonText).toBeInTheDocument();
          expect(lessonText.closest('a')).toBeNull();

          // Verify hierarchy order
          const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
          const breadcrumbText = breadcrumbNav.textContent || '';
          
          const dashboardIndex = breadcrumbText.indexOf('Dashboard');
          const programmeIndex = breadcrumbText.indexOf(programmeName);
          const moduleIndex = breadcrumbText.indexOf(moduleName);
          const lessonIndex = breadcrumbText.indexOf(lessonName);

          expect(dashboardIndex).toBeLessThan(programmeIndex);
          expect(programmeIndex).toBeLessThan(moduleIndex);
          expect(moduleIndex).toBeLessThan(lessonIndex);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});
