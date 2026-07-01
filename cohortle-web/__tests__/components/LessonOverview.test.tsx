/**
 * Unit tests for LessonOverview component
 * Tests lesson overview sidebar functionality
 */

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

describe('LessonOverview', () => {
  let queryClient: QueryClient;
  let mockPush: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      currentLessonId: '1',
      moduleId: '1',
      cohortId: '1',
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <LessonOverview {...defaultProps} />
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('should display loading skeleton while fetching lessons', () => {
      mockUseModuleLessons.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderComponent();

      expect(screen.getByText('Lessons')).toBeInTheDocument();
      // Check for loading skeletons
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should display error message when lessons fail to load', () => {
      mockUseModuleLessons.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any);

      renderComponent();

      expect(screen.getByText('Failed to load lessons')).toBeInTheDocument();
    });
  });

  describe('Lesson List Display', () => {
    it('should display all lessons in order', async () => {
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
        { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
        { id: 3, name: 'Lesson 3', order_number: 3, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent();

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);
        expect(buttons[0]).toHaveTextContent('Lesson 1');
        expect(buttons[1]).toHaveTextContent('Lesson 2');
        expect(buttons[2]).toHaveTextContent('Lesson 3');
      });
    });

    it('should display lesson order numbers', async () => {
      const mockLessons = [
        { id: 1, name: 'Introduction', order_number: 1, module_id: 1 },
        { id: 2, name: 'Advanced Topics', order_number: 2, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
        expect(screen.getByText('Lesson 2')).toBeInTheDocument();
      });
    });
  });

  describe('Current Lesson Highlighting', () => {
    it('should highlight the current lesson', async () => {
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
        { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent({ currentLessonId: '2' });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const lesson2Button = buttons.find(btn => btn.textContent?.includes('Lesson 2'));
        expect(lesson2Button).toHaveClass('bg-blue-50');
        expect(lesson2Button).toHaveClass('border-blue-500');
        expect(lesson2Button).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should not highlight non-current lessons', async () => {
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
        { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent({ currentLessonId: '2' });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const lesson1Button = buttons.find(btn => btn.textContent?.includes('Lesson 1'));
        expect(lesson1Button).not.toHaveClass('bg-blue-50');
        expect(lesson1Button).not.toHaveAttribute('aria-current');
      });
    });
  });

  describe('Completion Status Display', () => {
    it('should show completed icon for completed lessons', async () => {
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      mockFetchLessonCompletion.mockResolvedValue({
        lesson_id: 1,
        cohort_id: 1,
        user_id: 1,
        completed: true,
        completed_at: '2024-01-01T00:00:00Z',
      });

      renderComponent();

      await waitFor(() => {
        const completedIcon = screen.getByLabelText('Completed');
        expect(completedIcon).toBeInTheDocument();
        expect(completedIcon).toHaveClass('text-green-600');
      });
    });

    it('should show not completed icon for incomplete lessons', async () => {
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      mockFetchLessonCompletion.mockResolvedValue({
        lesson_id: 1,
        cohort_id: 1,
        user_id: 1,
        completed: false,
      });

      renderComponent();

      await waitFor(() => {
        const notCompletedIcon = screen.getByLabelText('Not completed');
        expect(notCompletedIcon).toBeInTheDocument();
        expect(notCompletedIcon).toHaveClass('text-gray-300');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to lesson when clicked', async () => {
      const user = userEvent.setup();
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
        { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent({ currentLessonId: '1', cohortId: '5' });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const buttons = screen.getAllByRole('button');
      const lesson2Button = buttons.find(btn => btn.textContent?.includes('Lesson 2'));
      await user.click(lesson2Button!);

      expect(mockPush).toHaveBeenCalledWith('/lessons/2?cohortId=5');
    });

    it('should include cohortId in navigation URL', async () => {
      const user = userEvent.setup();
      const mockLessons = [
        { id: 3, name: 'Lesson 3', order_number: 1, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent({ currentLessonId: '1', cohortId: '10' });

      await waitFor(() => {
        expect(screen.getByText('Lesson 3')).toBeInTheDocument();
      });

      const lesson3Button = screen.getByText('Lesson 3').closest('button');
      await user.click(lesson3Button!);

      expect(mockPush).toHaveBeenCalledWith('/lessons/3?cohortId=10');
    });
  });

  describe('Lesson Sorting', () => {
    it('should display lessons in order_number order', async () => {
      const mockLessons = [
        { id: 3, name: 'Lesson C', order_number: 3, module_id: 1 },
        { id: 1, name: 'Lesson A', order_number: 1, module_id: 1 },
        { id: 2, name: 'Lesson B', order_number: 2, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent();

      await waitFor(() => {
        const lessonButtons = screen.getAllByRole('button');
        const lessonNames = lessonButtons.map(btn => btn.textContent);
        
        // Check that lessons appear in order
        const lessonAIndex = lessonNames.findIndex(name => name?.includes('Lesson A'));
        const lessonBIndex = lessonNames.findIndex(name => name?.includes('Lesson B'));
        const lessonCIndex = lessonNames.findIndex(name => name?.includes('Lesson C'));
        
        expect(lessonAIndex).toBeLessThan(lessonBIndex);
        expect(lessonBIndex).toBeLessThan(lessonCIndex);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent({ currentLessonId: '1' });

      await waitFor(() => {
        const nav = screen.getByRole('navigation', { name: 'Lesson navigation' });
        expect(nav).toBeInTheDocument();
      });
    });

    it('should mark current lesson with aria-current', async () => {
      const mockLessons = [
        { id: 1, name: 'Lesson 1', order_number: 1, module_id: 1 },
        { id: 2, name: 'Lesson 2', order_number: 2, module_id: 1 },
      ];

      mockUseModuleLessons.mockReturnValue({
        data: mockLessons,
        isLoading: false,
        error: null,
      } as any);

      renderComponent({ currentLessonId: '1' });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const currentLessonButton = buttons.find(btn => btn.textContent?.includes('Lesson 1'));
        expect(currentLessonButton).toHaveAttribute('aria-current', 'page');
      });
    });
  });
});
