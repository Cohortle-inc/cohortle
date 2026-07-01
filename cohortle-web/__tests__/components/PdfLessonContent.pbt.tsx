/**
 * Property-Based Tests for PdfLessonContent Component
 * Feature: student-lesson-viewer-web
 */

import fc from 'fast-check';
import { render } from '@testing-library/react';
import { PdfLessonContent } from '@/components/lessons/PdfLessonContent';

describe('Feature: student-lesson-viewer-web - PdfLessonContent Properties', () => {
  /**
   * Property 7: PDF document embedding
   * For any lesson with a PDF URL, the Lesson_Viewer should create an iframe
   * or embed element with the PDF URL as the source.
   * 
   * Validates: Requirements 4.2
   */
  it('Property 7: PDF document embedding', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')),
          { minLength: 5, maxLength: 30 }
        ).map(chars => chars.join('')),
        (title, filename) => {
          const pdfUrl = `https://example.com/documents/${filename}.pdf`;
          
          const { container } = render(
            <PdfLessonContent title={title} pdfUrl={pdfUrl} />
          );

          // Should render an iframe
          const iframe = container.querySelector('iframe');
          expect(iframe).toBeTruthy();

          // The iframe src should contain the PDF filename
          expect(iframe?.src).toContain(filename);
          expect(iframe?.src).toContain('.pdf');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 6: Text content placement with media (PDF)
   * For any lesson containing both media (video/pdf) and text content,
   * the text content should appear after the media element in the DOM structure.
   * 
   * Validates: Requirements 4.5
   */
  it('Property 6: Text content placement with media (PDF)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 5, maxLength: 30 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        (title, filename, textContent) => {
          const pdfUrl = `https://example.com/documents/${filename}.pdf`;
          
          const { container } = render(
            <PdfLessonContent 
              title={title} 
              pdfUrl={pdfUrl} 
              textContent={textContent}
            />
          );

          // Get all elements
          const iframe = container.querySelector('iframe');
          const textDiv = container.querySelector('.prose');

          // Both should exist
          expect(iframe).toBeTruthy();
          expect(textDiv).toBeTruthy();

          // Text content should appear after PDF in DOM
          if (iframe && textDiv) {
            const iframePosition = Array.from(container.querySelectorAll('*')).indexOf(iframe);
            const textPosition = Array.from(container.querySelectorAll('*')).indexOf(textDiv);
            expect(textPosition).toBeGreaterThan(iframePosition);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 6: PDF Error Handling
   * For any invalid or inaccessible PDF URL, the system should display appropriate
   * error states without crashing.
   * 
   * **Validates: Requirements 1.12**
   */
  it('Property 6: PDF Error Handling', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(
          // Invalid URLs
          fc.constant(''),
          fc.constant('not-a-url'),
          fc.constant('javascript:alert(1)'),
          // Malformed URLs
          fc.string({ minLength: 1, maxLength: 20 }).map(s => `ht!tp://${s}`),
          // Non-existent domains
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `https://nonexistent-${s}.invalid/file.pdf`),
          // Invalid protocols
          fc.constantFrom('ftp://', 'file://', 'data:').chain(protocol =>
            fc.string({ minLength: 5, maxLength: 20 }).map(s => `${protocol}${s}.pdf`)
          ),
          // Missing file extension
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `https://example.com/${s}`),
          // Special characters in URL
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `https://example.com/${s}<script>.pdf`)
        ),
        (title, invalidUrl) => {
          // Component should render without crashing
          const { container } = render(
            <PdfLessonContent title={title} pdfUrl={invalidUrl} />
          );

          // Should render the component
          expect(container.querySelector('[data-testid="pdf-lesson"]')).toBeTruthy();

          // Should display title regardless of PDF error
          const titleElement = container.querySelector('h1');
          expect(titleElement).toBeTruthy();
          expect(titleElement?.textContent).toBe(title);

          // Should either show iframe or error state, but not crash
          const iframe = container.querySelector('iframe');
          const errorMessage = container.querySelector('.bg-yellow-50');
          
          // At least one should be present (either attempting to load or showing error)
          expect(iframe || errorMessage).toBeTruthy();

          // If error state is shown, it should have appropriate messaging
          if (errorMessage) {
            expect(errorMessage.textContent).toMatch(/PDF could not be displayed|download/i);
          }

          // Should provide download link regardless of error state
          const downloadLink = container.querySelector('a[download]');
          expect(downloadLink).toBeTruthy();
        }
      ),
      { numRuns: 20 }
    );
  });
});
