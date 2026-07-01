/**
 * Unit tests for WLIMPLessonViewer component
 * Tests lazy loading implementation for embedded content
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WLIMPLessonViewer } from '@/components/lessons/WLIMPLessonViewer';
import * as programmesApi from '@/lib/api/programmes';

// Mock the API
jest.mock('@/lib/api/programmes');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('WLIMPLessonViewer - Lazy Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading skeleton while fetching lesson data', async () => {
    // Mock API to delay response
    (programmesApi.getLessonById as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        id: '123',
        title: 'Test Lesson',
        description: 'Test Description',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        week_number: 1,
        week_title: 'Week 1',
        programme_id: 'prog-123',
        programme_name: 'Test Programme',
      }), 100))
    );

    render(<WLIMPLessonViewer lessonId="123" />);

    // Should show loading state
    expect(screen.getByText(/loading lesson/i)).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should render YouTube embed with loading="lazy" attribute', async () => {
    const mockLesson = {
      id: '123',
      title: 'Test Video Lesson',
      description: 'Test Description',
      content_type: 'video',
      content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      week_number: 1,
      week_title: 'Week 1',
      programme_id: 'prog-123',
      programme_name: 'Test Programme',
    };

    (programmesApi.getLessonById as jest.Mock).mockResolvedValue(mockLesson);

    render(<WLIMPLessonViewer lessonId="123" />);

    // Wait for lesson to load
    await waitFor(() => {
      expect(screen.getByText('Test Video Lesson')).toBeInTheDocument();
    });

    // Check for iframe with lazy loading
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should show video loading skeleton before iframe loads', async () => {
    const mockLesson = {
      id: '123',
      title: 'Test Video Lesson',
      description: 'Test Description',
      content_type: 'video',
      content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      week_number: 1,
      week_title: 'Week 1',
      programme_id: 'prog-123',
      programme_name: 'Test Programme',
    };

    (programmesApi.getLessonById as jest.Mock).mockResolvedValue(mockLesson);

    render(<WLIMPLessonViewer lessonId="123" />);

    // Wait for lesson data to load
    await waitFor(() => {
      expect(screen.getByText('Test Video Lesson')).toBeInTheDocument();
    });

    // Should show video loading skeleton
    expect(screen.getByText(/loading video/i)).toBeInTheDocument();
  });

  it('should render PDF link without loading skeleton', async () => {
    const mockLesson = {
      id: '123',
      title: 'Test PDF Lesson',
      description: 'Test Description',
      content_type: 'pdf',
      content_url: 'https://example.com/document.pdf',
      week_number: 1,
      week_title: 'Week 1',
      programme_id: 'prog-123',
      programme_name: 'Test Programme',
    };

    (programmesApi.getLessonById as jest.Mock).mockResolvedValue(mockLesson);

    render(<WLIMPLessonViewer lessonId="123" />);

    // Wait for lesson to load
    await waitFor(() => {
      expect(screen.getByText('Test PDF Lesson')).toBeInTheDocument();
    });

    // Should show PDF link
    const link = screen.getByRole('link', { name: /open pdf/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/document.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    
    // Should not show video loading skeleton
    expect(screen.queryByText(/loading video/i)).not.toBeInTheDocument();
  });

  it('should render Drive link without loading skeleton', async () => {
    const mockLesson = {
      id: '123',
      title: 'Test Drive Lesson',
      description: 'Test Description',
      content_type: 'link',
      content_url: 'https://drive.google.com/file/d/abc123',
      week_number: 1,
      week_title: 'Week 1',
      programme_id: 'prog-123',
      programme_name: 'Test Programme',
    };

    (programmesApi.getLessonById as jest.Mock).mockResolvedValue(mockLesson);

    render(<WLIMPLessonViewer lessonId="123" />);

    // Wait for lesson to load
    await waitFor(() => {
      expect(screen.getByText('Test Drive Lesson')).toBeInTheDocument();
    });

    // Should show link
    const link = screen.getByRole('link', { name: /open link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://drive.google.com/file/d/abc123');
    
    // Should not show video loading skeleton
    expect(screen.queryByText(/loading video/i)).not.toBeInTheDocument();
  });

  it('should handle error state gracefully', async () => {
    (programmesApi.getLessonById as jest.Mock).mockRejectedValue(
      new Error('Failed to load lesson')
    );

    render(<WLIMPLessonViewer lessonId="123" />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /failed to load lesson/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /failed to load lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
  });
});
