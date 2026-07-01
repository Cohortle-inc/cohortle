/**
 * Unit Tests for LinkLessonContent Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { LinkLessonContent } from '@/components/lessons/LinkLessonContent';
import { useMarkLessonComplete } from '@/lib/hooks/useLessonCompletion';

// Mock the completion hook
jest.mock('@/lib/hooks/useLessonCompletion', () => ({
  useMarkLessonComplete: jest.fn(),
}));

// Mock driveUrlUtils so we can control isDriveUrl / getDriveEmbedUrl in tests
jest.mock('@/lib/utils/driveUrlUtils', () => ({
  isDriveUrl: jest.fn((url: string) =>
    url.includes('drive.google.com') || url.includes('docs.google.com')
  ),
  getDriveEmbedUrl: jest.fn((url: string) => {
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([^/?#]+)/);
      return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
    }
    if (url.includes('docs.google.com/presentation/d/')) {
      const match = url.match(/\/d\/([^/?#]+)/);
      return match ? `https://docs.google.com/presentation/d/${match[1]}/embed` : null;
    }
    if (url.includes('docs.google.com/document/d/')) {
      const match = url.match(/\/d\/([^/?#]+)/);
      return match ? `https://docs.google.com/document/d/${match[1]}/preview` : null;
    }
    // Simulate video Drive URL returning null (cannot embed)
    return null;
  }),
}));

describe('LinkLessonContent', () => {
  const mockMarkComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useMarkLessonComplete as jest.Mock).mockReturnValue({
      mutate: mockMarkComplete,
    });
  });
  describe('URL display', () => {
    it('should display the external URL prominently', () => {
      const linkUrl = 'https://example.com/resource';
      
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl={linkUrl} 
        />
      );

      expect(screen.getByText(linkUrl)).toBeInTheDocument();
    });

    it('should handle long URLs with word break', () => {
      const longUrl = 'https://example.com/very/long/path/to/resource/that/should/break/properly';
      const { container } = render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl={longUrl} 
        />
      );

      const urlElement = screen.getByText(longUrl);
      expect(urlElement.className).toContain('break-all');
    });
  });

  describe('Button attributes', () => {
    it('should have target="_blank" attribute', () => {
      const linkUrl = 'https://example.com/resource';
      const { container } = render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl={linkUrl} 
        />
      );

      const link = container.querySelector('a[href="' + linkUrl + '"]');
      expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('should have rel="noopener noreferrer" attribute', () => {
      const linkUrl = 'https://example.com/resource';
      const { container } = render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl={linkUrl} 
        />
      );

      const link = container.querySelector('a[href="' + linkUrl + '"]');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should display "Open Link" button text', () => {
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource" 
        />
      );

      expect(screen.getByText('Open Link')).toBeInTheDocument();
    });
  });

  describe('External indicator icon presence', () => {
    it('should display external link indicator text', () => {
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource" 
        />
      );

      expect(screen.getByText(/opens in a new tab/i)).toBeInTheDocument();
    });

    it('should have external link icons', () => {
      const { container } = render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource" 
        />
      );

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Text content display', () => {
    it('should display text content with the link', () => {
      const textContent = '<p>This is additional information about the resource</p>';
      
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
          textContent={textContent}
        />
      );

      expect(screen.getByText('This is additional information about the resource')).toBeInTheDocument();
    });

    it('should sanitize HTML in text content', () => {
      const maliciousContent = '<p>Safe content</p><script>alert("xss")</script>';
      
      const { container } = render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
          textContent={maliciousContent}
        />
      );

      expect(screen.getByText('Safe content')).toBeInTheDocument();
      expect(container.querySelector('script')).toBeNull();
    });

    it('should not render text section when textContent is undefined', () => {
      const { container } = render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
        />
      );

      expect(container.querySelector('.prose')).toBeNull();
    });
  });

  describe('Title rendering', () => {
    it('should display the lesson title', () => {
      render(
        <LinkLessonContent 
          title="External Resources" 
          linkUrl="https://example.com/resource"
        />
      );

      expect(screen.getByText('External Resources')).toBeInTheDocument();
    });
  });

  describe('Visual styling', () => {
    it('should have a card-like container for the link', () => {
      const { container } = render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
        />
      );

      const card = container.querySelector('.bg-blue-50');
      expect(card).toBeTruthy();
    });
  });

  describe('Link click tracking', () => {
    it('should call markComplete when link is clicked and lesson is not completed', () => {
      const lessonId = 'lesson-123';
      const cohortId = 'cohort-456';
      
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
          lessonId={lessonId}
          cohortId={cohortId}
          isCompleted={false}
        />
      );

      const link = screen.getByText('Open Link').closest('a');
      fireEvent.click(link!);

      expect(mockMarkComplete).toHaveBeenCalledWith({
        lessonId,
        cohortId,
      });
    });

    it('should not call markComplete when lesson is already completed', () => {
      const lessonId = 'lesson-123';
      const cohortId = 'cohort-456';
      
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
          lessonId={lessonId}
          cohortId={cohortId}
          isCompleted={true}
        />
      );

      const link = screen.getByText('Open Link').closest('a');
      fireEvent.click(link!);

      expect(mockMarkComplete).not.toHaveBeenCalled();
    });

    it('should not call markComplete when lessonId is missing', () => {
      const cohortId = 'cohort-456';
      
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
          cohortId={cohortId}
          isCompleted={false}
        />
      );

      const link = screen.getByText('Open Link').closest('a');
      fireEvent.click(link!);

      expect(mockMarkComplete).not.toHaveBeenCalled();
    });

    it('should not call markComplete when cohortId is missing', () => {
      const lessonId = 'lesson-123';
      
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl="https://example.com/resource"
          lessonId={lessonId}
          isCompleted={false}
        />
      );

      const link = screen.getByText('Open Link').closest('a');
      fireEvent.click(link!);

      expect(mockMarkComplete).not.toHaveBeenCalled();
    });

    it('should still open the link even when tracking is not triggered', () => {
      const linkUrl = 'https://example.com/resource';
      
      render(
        <LinkLessonContent 
          title="Test Link" 
          linkUrl={linkUrl}
        />
      );

      const link = screen.getByText('Open Link').closest('a');
      expect(link?.getAttribute('href')).toBe(linkUrl);
      expect(link?.getAttribute('target')).toBe('_blank');
    });
  });

  describe('Drive URL rendering (Req 8.3, 8.4, 8.5)', () => {
    it('should render an iframe for a Drive URL with a valid embed URL (Req 8.3)', () => {
      const driveUrl = 'https://drive.google.com/file/d/abc123/view';

      const { container } = render(
        <LinkLessonContent title="Drive Lesson" linkUrl={driveUrl} />
      );

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeTruthy();
      expect(iframe?.getAttribute('src')).toBe(
        'https://drive.google.com/file/d/abc123/preview'
      );
    });

    it('should render "Open in Google Drive" fallback link alongside the iframe (Req 8.3)', () => {
      const driveUrl = 'https://drive.google.com/file/d/abc123/view';

      render(<LinkLessonContent title="Drive Lesson" linkUrl={driveUrl} />);

      const fallback = screen.getByText('Open in Google Drive');
      expect(fallback).toBeInTheDocument();
      expect(fallback.closest('a')?.getAttribute('href')).toBe(driveUrl);
    });

    it('should NOT render the standard "External Resource" card for Drive URLs', () => {
      const driveUrl = 'https://drive.google.com/file/d/abc123/view';

      render(<LinkLessonContent title="Drive Lesson" linkUrl={driveUrl} />);

      expect(screen.queryByText('External Resource')).toBeNull();
    });

    it('should show only "Open in Google Drive" when embed URL is null (video, Req 8.4)', () => {
      // getDriveEmbedUrl returns null for URLs not matching known patterns in our mock
      const videoUrl = 'https://drive.google.com/file/d/video123/view?video=true';

      // Override mock to return null for this URL
      const { getDriveEmbedUrl } = require('@/lib/utils/driveUrlUtils');
      getDriveEmbedUrl.mockReturnValueOnce(null);

      const { container } = render(
        <LinkLessonContent title="Video Lesson" linkUrl={videoUrl} />
      );

      expect(container.querySelector('iframe')).toBeNull();
      expect(screen.getByText('Open in Google Drive')).toBeInTheDocument();
    });

    it('should show fallback link when iframe onError fires (Req 8.5)', () => {
      const driveUrl = 'https://drive.google.com/file/d/abc123/view';

      const { container } = render(
        <LinkLessonContent title="Drive Lesson" linkUrl={driveUrl} />
      );

      // Simulate iframe load error
      const iframe = container.querySelector('iframe')!;
      fireEvent.error(iframe);

      // iframe should be gone, fallback link should remain
      expect(container.querySelector('iframe')).toBeNull();
      expect(screen.getByText('Open in Google Drive')).toBeInTheDocument();
    });

    it('should render existing external link card for non-Drive URLs', () => {
      render(
        <LinkLessonContent
          title="External Lesson"
          linkUrl="https://example.com/resource"
        />
      );

      expect(screen.getByText('External Resource')).toBeInTheDocument();
      expect(screen.getByText('Open Link')).toBeInTheDocument();
    });
  });
});
