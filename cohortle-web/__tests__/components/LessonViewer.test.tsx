/**
 * Unit tests for LessonViewer component
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonViewer } from '@/components/lessons/LessonViewer';
import * as lessonsApi from '@/lib/api/lessons';
import * as commentsApi from '@/lib/api/comments';
import { Lesson } from '@/types/lesson';

// Mock the APIs
jest.mock('@/lib/api/lessons');
jest.mock('@/lib/api/comments');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

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

describe('LessonViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue([]);
    (lessonsApi.fetchLessonCompletion as jest.Mock).mockResolvedValue({ completed: false });
    (lessonsApi.fetchModuleLessons as jest.Mock).mockResolvedValue([]);
  });

  it('should display loading state', () => {
    (lessonsApi.fetchLesson as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<LessonViewer lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    expect(screen.getByTestId('lesson-skeleton')).toBeInTheDocument();
  });

  it('should display error state', async () => {
    const mockError = new Error('Failed to fetch lesson');
    (lessonsApi.fetchLesson as jest.Mock).mockRejectedValue(mockError);

    render(<LessonViewer lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/error loading lesson/i)).toBeInTheDocument();
    });

    // Should have a retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should render TextLessonContent for text lessons', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'Text Lesson',
      description: 'A text lesson',
      text: '<p>This is the lesson content</p>',
      media: undefined,
      module_id: 1,
      order_number: 1,
      lesson_type: 'text',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);

    render(<LessonViewer lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Text Lesson')).toBeInTheDocument();
    });

    expect(screen.getByTestId('text-lesson-content')).toBeInTheDocument();
  });

  it('should render VideoLessonContent for video lessons', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'Video Lesson',
      description: 'A video lesson',
      text: undefined,
      media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      module_id: 1,
      order_number: 1,
      lesson_type: 'video',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);

    render(<LessonViewer lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Video Lesson')).toBeInTheDocument();
    });

    expect(screen.getByTestId('video-lesson-content')).toBeInTheDocument();
  });

  it('should render PdfLessonContent for PDF lessons', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'PDF Lesson',
      description: 'A PDF lesson',
      text: undefined,
      media: 'https://example.com/document.pdf',
      module_id: 1,
      order_number: 1,
      lesson_type: 'pdf',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);

    render(<LessonViewer lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('PDF Lesson')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pdf-lesson-content')).toBeInTheDocument();
  });

  it('should render LinkLessonContent for link lessons', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'Link Lesson',
      description: 'A link lesson',
      text: undefined,
      media: 'https://example.com/resource',
      module_id: 1,
      order_number: 1,
      lesson_type: 'link',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);

    render(<LessonViewer lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Link Lesson')).toBeInTheDocument();
    });

    expect(screen.getByTestId('link-lesson-content')).toBeInTheDocument();
  });

  it('should render all child components', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'Complete Lesson',
      description: 'A complete lesson',
      text: '<p>Content</p>',
      media: undefined,
      module_id: 1,
      order_number: 1,
      lesson_type: 'text',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);

    render(<LessonViewer lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Complete Lesson')).toBeInTheDocument();
    });

    // Should render content component
    expect(screen.getByTestId('text-lesson-content')).toBeInTheDocument();

    // Should render completion button
    expect(screen.getByTestId('completion-button')).toBeInTheDocument();

    // Should render navigation
    expect(screen.getByTestId('lesson-navigation')).toBeInTheDocument();

    // Should render comments
    expect(screen.getByTestId('lesson-comments')).toBeInTheDocument();
  });

  it('should handle auto-completion on video end', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'Video Lesson',
      description: 'A video lesson',
      text: undefined,
      media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      module_id: 1,
      order_number: 1,
      lesson_type: 'video',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);
    (lessonsApi.markLessonComplete as jest.Mock).mockResolvedValue(undefined);

    const { container } = render(
      <LessonViewer lessonId="1" cohortId="1" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Video Lesson')).toBeInTheDocument();
    });

    // Simulate video end event
    const videoContent = screen.getByTestId('video-lesson-content');
    const onVideoEnd = videoContent.getAttribute('data-on-video-end');
    
    if (onVideoEnd) {
      // Trigger the callback
      const iframe = videoContent.querySelector('iframe');
      if (iframe) {
        // Simulate video ended
        iframe.dispatchEvent(new Event('ended'));
      }
    }

    // The completion API should be called
    await waitFor(() => {
      expect(lessonsApi.markLessonComplete).toHaveBeenCalledWith('1', '1');
    });
  });
});
