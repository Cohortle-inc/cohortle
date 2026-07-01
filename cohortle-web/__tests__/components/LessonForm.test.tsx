/**
 * LessonForm Component Tests
 * Tests for lesson creation form with all content types
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LessonForm } from '@/components/convener/LessonForm';
import { LessonFormData } from '@/lib/api/convener';

describe('LessonForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const weekId = 'week-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Type Handling', () => {
    it('should show URL input for video content type', () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Video is the default content type
      expect(screen.getByLabelText(/video url/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/youtube\.com/i)).toBeInTheDocument();
    });

    it('should show URL input for PDF content type', () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to PDF content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'pdf' } });

      expect(screen.getByLabelText(/pdf url/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/document\.pdf/i)).toBeInTheDocument();
    });

    it('should show URL input for link content type', () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to link content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'link' } });

      expect(screen.getByLabelText(/external link url/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/example\.com/i)).toBeInTheDocument();
    });

    it('should show text area for text content type', () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to text content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'text' } });

      expect(screen.getByLabelText(/text content/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter lesson text content/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should require URL for video content', async () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in title
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });

      // Submit without URL
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(screen.getByText(/video url is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate YouTube URL for video content', async () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in title
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });

      // Enter invalid URL
      fireEvent.change(screen.getByLabelText(/video url/i), {
        target: { value: 'https://example.com/video' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(screen.getByText(/youtube or vimeo/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require text content for text type', async () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to text content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'text' } });

      // Fill in title
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });

      // Submit without text content
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(screen.getByText(/text content is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate PDF URL format', async () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to PDF content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'pdf' } });

      // Fill in title
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });

      // Enter invalid PDF URL
      fireEvent.change(screen.getByLabelText(/pdf url/i), {
        target: { value: 'https://example.com/document.txt' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(screen.getByText(/contain \/pdf\/ in the path, or be a Google Drive/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should accept YouTube URLs in various formats', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      const youtubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=abc123',
      ];

      for (const url of youtubeUrls) {
        const { unmount } = render(
          <LessonForm
            weekId={weekId}
            mode="create"
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        );

        fireEvent.change(screen.getByLabelText(/lesson title/i), {
          target: { value: 'Test Lesson' },
        });
        fireEvent.change(screen.getByLabelText(/video url/i), {
          target: { value: url },
        });
        fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalled();
        });

        mockOnSubmit.mockClear();
        unmount();
      }
    });

    it('should accept Vimeo URLs', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/video url/i), {
        target: { value: 'https://vimeo.com/123456789' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should accept PDF URLs ending with .pdf', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'pdf' } });

      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/pdf url/i), {
        target: { value: 'https://example.com/document.pdf' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should accept PDF URLs containing /pdf/', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'pdf' } });

      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/pdf url/i), {
        target: { value: 'https://example.com/pdf/document' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should accept any valid URL for link content type', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'link' } });

      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/external link url/i), {
        target: { value: 'https://www.example.com/article/123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should validate text content length up to 50000 characters', async () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'text' } });

      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });

      // Create text content that exceeds 50000 characters
      const longText = 'a'.repeat(50001);
      fireEvent.change(screen.getByLabelText(/text content/i), {
        target: { value: longText },
      });

      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(screen.getByText(/50,000 characters or less/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should accept text content up to 50000 characters', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'text' } });

      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Lesson' },
      });

      // Create text content exactly 50000 characters
      const maxText = 'a'.repeat(50000);
      fireEvent.change(screen.getByLabelText(/text content/i), {
        target: { value: maxText },
      });

      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid video lesson data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in form
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Video Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/video url/i), {
        target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Video Lesson',
            contentType: 'video',
            contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          })
        );
      });
    });

    it('should submit valid text lesson data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to text content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'text' } });

      // Fill in form
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Text Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/text content/i), {
        target: { value: 'This is the lesson content.' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Text Lesson',
            contentType: 'text',
            contentText: 'This is the lesson content.',
          })
        );
      });
    });

    it('should submit valid PDF lesson data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to PDF content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'pdf' } });

      // Fill in form
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test PDF Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/pdf url/i), {
        target: { value: 'https://example.com/document.pdf' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test PDF Lesson',
            contentType: 'pdf',
            contentUrl: 'https://example.com/document.pdf',
          })
        );
      });
    });

    it('should submit valid link lesson data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Change to link content type
      const contentTypeSelect = screen.getByLabelText(/content type/i);
      fireEvent.change(contentTypeSelect, { target: { value: 'link' } });

      // Fill in form
      fireEvent.change(screen.getByLabelText(/lesson title/i), {
        target: { value: 'Test Link Lesson' },
      });
      fireEvent.change(screen.getByLabelText(/external link url/i), {
        target: { value: 'https://example.com/article' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create lesson/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Link Lesson',
            contentType: 'link',
            contentUrl: 'https://example.com/article',
          })
        );
      });
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <LessonForm
          weekId={weekId}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
