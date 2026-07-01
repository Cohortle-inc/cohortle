/**
 * Property-Based Tests: TextLessonContent Component
 * Feature: student-lesson-viewer-web
 * 
 * Tests for text lesson rendering with HTML content preservation and title placement
 */

import fc from 'fast-check';
import { render } from '@testing-library/react';
import { TextLessonContent } from '@/components/lessons/TextLessonContent';

describe('Feature: student-lesson-viewer-web - TextLessonContent', () => {
  /**
   * Property 2: HTML content rendering preservation
   * **Validates: Requirements 2.2, 2.4**
   * 
   * For any valid HTML content received from the API, the rendered output
   * should preserve all formatting tags (bold, italic, lists, headings, etc.).
   * 
   * This property verifies that:
   * 1. HTML formatting tags are preserved in the rendered output
   * 2. Content is sanitized but formatting is maintained
   * 3. All common rich text elements are supported
   */
  describe('Property 2: HTML content rendering preservation', () => {
    // Generator for safe text content (alphanumeric and common punctuation, no HTML-like characters)
    const safeTextArbitrary = fc.string({
      minLength: 1,
      maxLength: 50
    }).filter(s => !s.includes('<') && !s.includes('>') && s.trim().length > 0);

    it('should preserve bold formatting in rendered content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<strong>${content}</strong>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const strongElement = container.querySelector('strong');
            expect(strongElement).toBeTruthy();
            expect(strongElement?.textContent).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve italic formatting in rendered content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<em>${content}</em>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const emElement = container.querySelector('em');
            expect(emElement).toBeTruthy();
            expect(emElement?.textContent).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve heading tags in rendered content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6'),
          (title, content, headingTag) => {
            const htmlContent = `<${headingTag}>${content}</${headingTag}>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            // Look for the heading in the content area (not the title)
            const contentDiv = container.querySelector('.prose');
            const headingElement = contentDiv?.querySelector(headingTag);
            expect(headingElement).toBeTruthy();
            expect(headingElement?.textContent).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve list structures in rendered content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.array(safeTextArbitrary, { minLength: 1, maxLength: 5 }),
          (title, items) => {
            const htmlContent = `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const ulElement = container.querySelector('ul');
            expect(ulElement).toBeTruthy();
            
            const liElements = container.querySelectorAll('li');
            expect(liElements.length).toBe(items.length);
            
            liElements.forEach((li, index) => {
              expect(li.textContent).toBe(items[index]);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve paragraph tags in rendered content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<p>${content}</p>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const pElement = container.querySelector('.prose p');
            expect(pElement).toBeTruthy();
            expect(pElement?.textContent).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve nested formatting tags', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<p><strong><em>${content}</em></strong></p>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const strongElement = container.querySelector('strong');
            const emElement = container.querySelector('em');
            expect(strongElement).toBeTruthy();
            expect(emElement).toBeTruthy();
            expect(emElement?.textContent).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve blockquote tags in rendered content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<blockquote>${content}</blockquote>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const blockquoteElement = container.querySelector('blockquote');
            expect(blockquoteElement).toBeTruthy();
            expect(blockquoteElement?.textContent).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve code tags in rendered content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<code>${content}</code>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const codeElement = container.querySelector('code');
            expect(codeElement).toBeTruthy();
            expect(codeElement?.textContent).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 3: Lesson title placement
   * **Validates: Requirements 2.3**
   * 
   * For any lesson, the title should appear before the main content
   * in the DOM structure.
   * 
   * This property verifies that:
   * 1. The title element exists in the rendered output
   * 2. The title appears before the content in DOM order
   * 3. The title is correctly displayed regardless of content
   */
  describe('Property 3: Lesson title placement', () => {
    // Generator for safe text content
    const safeTextArbitrary = fc.string({
      minLength: 1,
      maxLength: 100
    }).filter(s => !s.includes('<') && !s.includes('>') && s.trim().length > 0);

    it('should render title before content in DOM order', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<p>${content}</p>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            // Find the title element (h1)
            const titleElement = container.querySelector('h1');
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe(title);
            
            // Find the content container
            const contentElement = container.querySelector('.prose');
            expect(contentElement).toBeTruthy();
            
            // Verify title comes before content in DOM order
            const allElements = Array.from(container.querySelectorAll('h1, .prose'));
            const titleIndex = allElements.indexOf(titleElement!);
            const contentIndex = allElements.indexOf(contentElement!);
            
            expect(titleIndex).toBeLessThan(contentIndex);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should display title prominently with correct text', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (title, content) => {
            const htmlContent = `<p>${content}</p>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const titleElement = container.querySelector('h1');
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe(title);
            
            // Verify it's styled as a prominent heading
            expect(titleElement?.tagName).toBe('H1');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should render title even with empty content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          (title) => {
            const htmlContent = '';
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const titleElement = container.querySelector('h1');
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe(title);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should render title with special characters correctly', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          safeTextArbitrary,
          (baseTitle, content) => {
            // Add special characters to title (but not HTML-like ones)
            const title = `${baseTitle} & "Special" 'Characters'`;
            const htmlContent = `<p>${content}</p>`;
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const titleElement = container.querySelector('h1');
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe(title);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain title-content separation with complex HTML', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          fc.array(safeTextArbitrary, { minLength: 1, maxLength: 3 }),
          (title, paragraphs) => {
            const htmlContent = paragraphs.map(p => `<p>${p}</p>`).join('');
            const { container } = render(
              <TextLessonContent title={title} htmlContent={htmlContent} />
            );
            
            const titleElement = container.querySelector('h1');
            const contentElement = container.querySelector('.prose');
            
            expect(titleElement).toBeTruthy();
            expect(contentElement).toBeTruthy();
            
            // Title should not be inside the prose content area
            const titleInContent = contentElement?.contains(titleElement!);
            expect(titleInContent).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
