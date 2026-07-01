/**
 * Unit tests for lesson page
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams, useSearchParams } from 'next/navigation';
import LessonPage from '@/app/lessons/[lessonId]/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock LessonViewer component
jest.mock('@/components/lessons/LessonViewer', () => ({
  LessonViewer: ({ lessonId, cohortId }: { lessonId: string; cohortId: string }) => (
    <div data-testid="lesson-viewer">
      LessonViewer: {lessonId}, {cohortId}
    </div>
  ),
}));

// Mock WLIMPLessonViewer component
jest.mock('@/components/lessons/WLIMPLessonViewer', () => ({
  WLIMPLessonViewer: ({ lessonId }: { lessonId: string }) => (
    <div data-testid="wlimp-lesson-viewer">WLIMPLessonViewer: {lessonId}</div>
  ),
}));

describe('Lesson Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract lessonId from route params', async () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: '123' });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'cohortId' ? '456' : null),
    });

    render(<LessonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('lesson-viewer')).toHaveTextContent('LessonViewer: 123, 456');
    });
  });

  it('should extract cohortId from query params', async () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: '789' });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'cohortId' ? '101' : null),
    });

    render(<LessonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('lesson-viewer')).toHaveTextContent('LessonViewer: 789, 101');
    });
  });

  it('should display validation error when lessonId is missing', () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: undefined });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'cohortId' ? '456' : null),
    });

    render(<LessonPage />);

    expect(screen.getByText(/invalid lesson url/i)).toBeInTheDocument();
    expect(screen.getByText(/lesson id is missing/i)).toBeInTheDocument();
  });

  it('should display validation error when cohortId is missing', () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: '123' });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    });

    render(<LessonPage />);

    expect(screen.getByText(/invalid lesson url/i)).toBeInTheDocument();
    expect(screen.getByText(/cohort id is missing/i)).toBeInTheDocument();
  });

  it('should display validation error when both parameters are missing', () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: undefined });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    });

    render(<LessonPage />);

    expect(screen.getByText(/invalid lesson url/i)).toBeInTheDocument();
    expect(screen.getByText(/lesson id is missing/i)).toBeInTheDocument();
    expect(screen.getByText(/cohort id is missing/i)).toBeInTheDocument();
  });

  it('should display validation error for non-numeric lessonId', () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: 'abc' });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'cohortId' ? '456' : null),
    });

    render(<LessonPage />);

    expect(screen.getByText(/invalid parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/must be valid numbers/i)).toBeInTheDocument();
  });

  it('should display validation error for non-numeric cohortId', () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: '123' });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'cohortId' ? 'xyz' : null),
    });

    render(<LessonPage />);

    expect(screen.getByText(/invalid parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/must be valid numbers/i)).toBeInTheDocument();
  });

  it('should render LessonViewer with valid params', async () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: '42' });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'cohortId' ? '99' : null),
    });

    render(<LessonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('lesson-viewer')).toBeInTheDocument();
    });
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
  });

  it('should provide back to dashboard link on validation error', () => {
    (useParams as jest.Mock).mockReturnValue({ lessonId: undefined });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    });

    render(<LessonPage />);

    const backLink = screen.getByRole('link', { name: /back to dashboard/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/dashboard');
  });
});
