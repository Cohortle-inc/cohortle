/**
 * Property-Based Tests for LinkLessonContent Component
 * Feature: student-lesson-viewer-web
 */

import fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { LinkLessonContent } from '@/components/lessons/LinkLessonContent';
import { useMarkLessonComplete } from '@/lib/hooks/useLessonCompletion';

// Mock the completion hook
jest.mock('@/lib/hooks/useLessonCompletion', () => ({
  useMarkLessonComplete: jest.fn(),
}));

describe('Feature: student-lesson-viewer-web - LinkLessonContent Properties', () => {
  const mockMarkComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useMarkLessonComplete as jest.Mock).mockReturnValue({
      mutate: mockMarkComplete,
    });
  });
  /**
   * Property 8: External link display
   * For any link lesson, the rendered output should contain the external URL
   * in visible text and a button/link element with target="_blank" attribute.
   * 
   * Validates: Requirements 5.1, 5.2
   */
  it('Property 8: External link display', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (title, linkUrl) => {
          const { container } = render(
            <LinkLessonContent title={title} linkUrl={linkUrl} />
          );

          // Should display the URL in visible text
          expect(screen.getByText(linkUrl)).toBeInTheDocument();

          // Should have a link with target="_blank"
          const link = container.querySelector('a[target="_blank"]');
          expect(link).toBeTruthy();
          expect(link?.getAttribute('href')).toBe(linkUrl);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 9: External link indicator presence
   * For any link lesson, the rendered output should include a visual indicator
   * (icon or text) that the link opens an external resource.
   * 
   * Validates: Requirements 5.4
   */
  it('Property 9: External link indicator presence', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (title, linkUrl) => {
          const { container } = render(
            <LinkLessonContent title={title} linkUrl={linkUrl} />
          );

          // Should have external link indicator text
          const indicators = screen.getAllByText(/opens in a new tab/i);
          expect(indicators.length).toBeGreaterThan(0);

          // Should have external link icon (SVG)
          const svgs = container.querySelectorAll('svg');
          expect(svgs.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 10: Link lesson text content display
   * For any link lesson with text content, the text content should be
   * rendered alongside the link.
   * 
   * Validates: Requirements 5.3
   */
  it('Property 10: Link lesson text content display', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        fc.string({ minLength: 10, maxLength: 200 }),
        (title, linkUrl, textContent) => {
          const { container } = render(
            <LinkLessonContent 
              title={title} 
              linkUrl={linkUrl} 
              textContent={textContent}
            />
          );

          // Should have text content rendered
          const textDiv = container.querySelector('.prose');
          expect(textDiv).toBeTruthy();

          // Should have the link displayed
          expect(screen.getByText(linkUrl)).toBeInTheDocument();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 7: External Link Attributes
   * For any link lesson, external links should have target="_blank" and 
   * appropriate security attributes (rel="noopener noreferrer").
   * 
   * **Validates: Requirements 1.16**
   */
  it('Property 7: External Link Attributes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (title, linkUrl) => {
          const { container } = render(
            <LinkLessonContent title={title} linkUrl={linkUrl} />
          );

          // Find the external link element by target="_blank" attribute
          // (safer than using href in selector due to special characters)
          const links = container.querySelectorAll('a[target="_blank"]');
          const link = Array.from(links).find(l => l.getAttribute('href') === linkUrl);
          
          // Should have target="_blank" attribute
          expect(link).toBeTruthy();
          expect(link?.getAttribute('target')).toBe('_blank');
          
          // Should have security attributes to prevent tabnabbing
          const relAttr = link?.getAttribute('rel');
          expect(relAttr).toBeTruthy();
          expect(relAttr).toContain('noopener');
          expect(relAttr).toContain('noreferrer');
        }
      ),
      { numRuns: 20 }
    );
  });
});
