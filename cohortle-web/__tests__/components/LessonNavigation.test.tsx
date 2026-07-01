/**
 * Unit Tests for LessonNavigation Component
 * Feature: mvp-completion-gaps
 */

import { render, screen, fireEvent } from '@testing-library/react';
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

describe('LessonNavigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state while fetching lessons', () => {
    mockUseModuleLessons.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <LessonNavigation
        currentLessonId="1"
        moduleId="1"
        cohortId="1"
        isCompleted={false}
      />,
      { wrapper: createWrapper() }
    );

    // Should show loading skeleton
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should render error state when fetching fails', () => {
    mockUseModuleLessons.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    render(
      <LessonNavigation
        currentLessonId="1"
        moduleId="1"
        cohortId="1"
        isCompleted={false}
      />,
      { wrapper: createWrapper() }
    );

    // Should show back to dashboard button
    const backButton = screen.getByText('← Back to Dashboard');
    expect(backButton).toBeInTheDocument();
  });

  it('should disable previous button on first lesson', () => {
    const lessons: ModuleLesson[] = [
      { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
      { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
      { id: 3, name: 'Lesson 3', order_number: 3, module_id: 1 },
    ];

    mockUseModuleLessons.mockReturnValue({
      data: lessons,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(
      <LessonNavigation
        currentLessonId="1"
        moduleId="1"
        cohortId="1"
        isCompleted={false}
      />,
      { wrapper: createWrapper() }
    );

    const previousButton = container.querySelector('button[aria-label="Previous lesson"]');
    expect(previousButton).toBeDisabled();
  });

  it('should disable next button on last lesson', () => {
    const lessons: ModuleLesson[] = [
      { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
      { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
      { id: 3, name: 'Lesson 3', order_number: 3, module_id: 1 },
    ];

    mockUseModuleLessons.mockReturnValue({
      data: lessons,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(
      <LessonNavigation
        currentLessonId="3"
        moduleId="1"
        cohortId="1"
        isCompleted={false}
      />,
      { wrapper: createWrapper() }
    );

    const nextButton = container.querySelector('button[aria-label="Next lesson"]');
    expect(nextButton).toBeDisabled();
  });

  it('should enable both buttons on middle lesson', () => {
    const lessons: ModuleLesson[] = [
      { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
      { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
      { id: 3, name: 'Lesson 3', order_number: 3, module_id: 1 },
    ];

    mockUseModuleLessons.mockReturnValue({
      data: lessons,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(
      <LessonNavigation
        currentLessonId="2"
        moduleId="1"
        cohortId="1"
        isCompleted={false}
      />,
      { wrapper: createWrapper() }
    );

    const previousButton = container.querySelector('button[aria-label="Previous lesson"]');
    const nextButton = container.querySelector('button[aria-label="Next lesson"]');
    
    expect(previousButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it('should always show back to module button', () => {
    const lessons: ModuleLesson[] = [
      { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
    ];

    mockUseModuleLessons.mockReturnValue({
      data: lessons,
      isLoading: false,
      error: null,
    } as any);

    render(
      <LessonNavigation
        currentLessonId="1"
        moduleId="1"
        cohortId="1"
        isCompleted={false}
      />,
      { wrapper: createWrapper() }
    );

    const backButton = screen.getByText('← Back to Module');
    expect(backButton).toBeInTheDocument();
  });

  it('should handle lessons with non-sequential order numbers', () => {
    const lessons: ModuleLesson[] = [
      { id: 1, name: 'Lesson 1', order_number: 5, module_id: 1 },
      { id: 2, name: 'Lesson 2', order_number: 10, module_id: 1 },
      { id: 3, name: 'Lesson 3', order_number: 15, module_id: 1 },
    ];

    mockUseModuleLessons.mockReturnValue({
      data: lessons,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(
      <LessonNavigation
        currentLessonId="2"
        moduleId="1"
        cohortId="1"
        isCompleted={false}
      />,
      { wrapper: createWrapper() }
    );

    // Should enable both buttons since lesson 2 is in the middle
    const previousButton = container.querySelector('button[aria-label="Previous lesson"]');
    const nextButton = container.querySelector('button[aria-label="Next lesson"]');
    
    expect(previousButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });
});
