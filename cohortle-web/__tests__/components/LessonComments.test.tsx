/**
 * Unit tests for LessonComments component
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonComments } from '@/components/lessons/LessonComments';
import * as commentsApi from '@/lib/api/comments';
import { LessonComment } from '@/types/lesson';
import * as AuthContext from '@/lib/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api/comments');

// Mock useAuth hook
jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: '1', email: 'test@example.com', username: 'testuser', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  })),
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

describe('LessonComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display comments in chronological order', async () => {
    const mockComments: LessonComment[] = [
      {
        id: 3,
        lesson_id: 1,
        cohort_id: 1,
        user_id: 1,
        author_name: 'Alice',
        content: 'Third comment',
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T10:00:00Z',
      },
      {
        id: 1,
        lesson_id: 1,
        cohort_id: 1,
        user_id: 2,
        author_name: 'Bob',
        content: 'First comment',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        lesson_id: 1,
        cohort_id: 1,
        user_id: 3,
        author_name: 'Charlie',
        content: 'Second comment',
        created_at: '2024-01-02T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
      },
    ];

    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue(mockComments);
    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue({});

    render(<LessonComments lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });

    const comments = screen.getAllByTestId(/^comment-/);
    expect(comments).toHaveLength(3);
    
    // Verify order: oldest first
    expect(comments[0]).toHaveTextContent('First comment');
    expect(comments[1]).toHaveTextContent('Second comment');
    expect(comments[2]).toHaveTextContent('Third comment');
  });

  it('should display author name and timestamp for each comment', async () => {
    const mockComment: LessonComment = {
      id: 1,
      lesson_id: 1,
      cohort_id: 1,
      user_id: 1,
      author_name: 'John Doe',
      content: 'Great lesson!',
      created_at: '2024-01-15T14:30:00Z',
      updated_at: '2024-01-15T14:30:00Z',
    };

    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue([mockComment]);
    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue({});

    render(<LessonComments lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Great lesson!')).toBeInTheDocument();
    // Timestamp should be displayed in some format
    const commentElement = screen.getByTestId('comment-1');
    expect(commentElement).toHaveAttribute('data-timestamp');
  });

  it('should handle comment form submission', async () => {
    const mockComments: LessonComment[] = [];
    const newComment: LessonComment = {
      id: 1,
      lesson_id: 1,
      cohort_id: 1,
      user_id: 1,
      author_name: 'Current User',
      content: 'My new comment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue(mockComments);
    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue(newComment);

    render(<LessonComments lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/add a comment/i);
    const submitButton = screen.getByRole('button', { name: /post comment/i });

    fireEvent.change(textarea, { target: { value: 'My new comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(commentsApi.postLessonComment).toHaveBeenCalledWith('1', '1', 'My new comment');
    });
  });

  it('should display empty state message when no comments exist', async () => {
    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue([]);
    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue({});

    render(<LessonComments lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (commentsApi.fetchLessonComments as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue({});

    render(<LessonComments lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    const mockError = new Error('Failed to fetch comments');
    (commentsApi.fetchLessonComments as jest.Mock).mockRejectedValue(mockError);
    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue({});

    render(<LessonComments lessonId="1" cohortId="1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/error loading comments/i)).toBeInTheDocument();
    });
  });
});
