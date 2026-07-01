/**
 * Property-Based Tests for CompletionButton Component
 * Feature: student-lesson-viewer-web
 */

import fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompletionButton } from '@/components/lessons/CompletionButton';

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

describe('Feature: student-lesson-viewer-web - CompletionButton Properties', () => {
  /**
   * Property 11: Completion button conditional rendering
   * For any lesson with completion status completed=false, the UI should render
   * a "Mark as Complete" button; for any lesson with completed=true, the UI
   * should render a "Completed" indicator instead.
   * 
   * Validates: Requirements 6.2, 6.5
   */
  it('Property 11: Completion button conditional rendering', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.boolean(),
        (lessonId, cohortId, isCompleted) => {
          const Wrapper = createWrapper();
          
          const { container } = render(
            <CompletionButton 
              lessonId={lessonId} 
              cohortId={cohortId} 
              isCompleted={isCompleted}
            />,
            { wrapper: Wrapper }
          );

          if (isCompleted) {
            // Should show "Completed" indicator in this container
            const completedText = container.textContent?.includes('Completed');
            expect(completedText).toBe(true);
            
            // Should NOT show "Mark as Complete" button in this container
            const markCompleteText = container.textContent?.includes('Mark as Complete');
            expect(markCompleteText).toBe(false);
            
            // Should not have a button element
            const button = container.querySelector('button');
            expect(button).toBeNull();
          } else {
            // Should show "Mark as Complete" button in this container
            const markCompleteText = container.textContent?.includes('Mark as Complete');
            expect(markCompleteText).toBe(true);
            
            // Should NOT show "Completed" indicator in this container
            const completedText = container.textContent?.includes('Completed');
            expect(completedText).toBe(false);
            
            // Should have a button element
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 12: Completion Button State
   * For any lesson, the completion button should show "Mark Complete" for incomplete 
   * lessons and "Completed" with checkmark for completed lessons. The button should 
   * display correct visual states based on completion status.
   * 
   * **Validates: Requirements 2.1, 2.3**
   */
  it('Property 12: Completion button state displays correct text and visual elements', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.integer({ min: 1, max: 10000 }).map(String),
        fc.boolean(),
        (lessonId, cohortId, isCompleted) => {
          const Wrapper = createWrapper();
          
          const { container } = render(
            <CompletionButton 
              lessonId={lessonId} 
              cohortId={cohortId} 
              isCompleted={isCompleted}
            />,
            { wrapper: Wrapper }
          );

          if (isCompleted) {
            // Verify "Completed" text is displayed
            const completedText = container.textContent?.includes('Completed');
            expect(completedText).toBe(true);

            // Verify SVG icon is present (Phosphor CheckCircle renders an SVG)
            const svgIcon = container.querySelector('svg');
            expect(svgIcon).toBeTruthy();

            // Verify green color scheme for completed state
            const greenContainer = container.querySelector('.bg-green-50');
            expect(greenContainer).toBeTruthy();

            // Verify no button element (completed state is not clickable)
            const button = container.querySelector('button');
            expect(button).toBeNull();
          } else {
            // Verify "Mark as Complete" text is displayed
            const markCompleteText = container.textContent?.includes('Mark as Complete');
            expect(markCompleteText).toBe(true);

            // Verify button element exists
            const button = container.querySelector('button');
            expect(button).toBeTruthy();

            // Verify button has blue background (incomplete state)
            expect(button?.className).toContain('bg-blue-600');

            // Verify button is enabled by default
            expect(button?.hasAttribute('disabled')).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
