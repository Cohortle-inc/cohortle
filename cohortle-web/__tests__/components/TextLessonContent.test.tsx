/**
 * Unit Tests: TextLessonContent Component
 * Feature: student-lesson-viewer-web
 * 
 * Tests for specific examples and edge cases in text lesson rendering
 */

import { render } from '@testing-library/react';
import { TextLessonContent } from '@/components/lessons/TextLessonContent';

describe('TextLessonContent - Unit Tests', () => {
  describe('HTML Formatting', () => {
    it('should render bold text correctly', () => {
      const { container } = render(
        <TextLessonContent 
          title="Test Lesson" 
          htmlContent="<p>This is <strong>bold</strong> text</p>" 
        />
      );
      
      const strongElement = container.querySelector('strong');
      expect(strongElement).toBeTruthy();
      expect(strongElement?.textContent).toBe('bold');
    });

    it('should render italic text correctly', () => {
      const { container } = render(
        <TextLessonContent 
          title="Test Lesson" 
          htmlContent="<p>This is <em>italic</em> text</p>" 
        />
      );
      
      const emElement = container.querySelector('em');
      expect(emElement).toBeTruthy();
      expect(emElement?.textContent).toBe('italic');
    });

    it('should render unordered lists correctly', () => {
      const htmlContent = `
        <ul>
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ul>
      `;
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={htmlContent} />
      );
      
      const ulElement = container.querySelector('ul');
      expect(ulElement).toBeTruthy();
      
      const liElements = container.querySelectorAll('li');
      expect(liElements).toHaveLength(3);
      expect(liElements[0].textContent).toBe('First item');
      expect(liElements[1].textContent).toBe('Second item');
      expect(liElements[2].textContent).toBe('Third item');
    });

    it('should render ordered lists correctly', () => {
      const htmlContent = `
        <ol>
          <li>Step one</li>
          <li>Step two</li>
          <li>Step three</li>
        </ol>
      `;
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={htmlContent} />
      );
      
      const olElement = container.querySelector('ol');
      expect(olElement).toBeTruthy();
      
      const liElements = container.querySelectorAll('li');
      expect(liElements).toHaveLength(3);
    });

    it('should render headings correctly', () => {
      const htmlContent = `
        <h2>Section Title</h2>
        <p>Section content</p>
        <h3>Subsection Title</h3>
        <p>Subsection content</p>
      `;
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={htmlContent} />
      );
      
      const h2Element = container.querySelector('.prose h2');
      const h3Element = container.querySelector('.prose h3');
      
      expect(h2Element).toBeTruthy();
      expect(h2Element?.textContent).toBe('Section Title');
      expect(h3Element).toBeTruthy();
      expect(h3Element?.textContent).toBe('Subsection Title');
    });

    it('should render complex nested formatting', () => {
      const htmlContent = `
        <p>This paragraph has <strong>bold</strong>, <em>italic</em>, and <strong><em>bold italic</em></strong> text.</p>
      `;
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={htmlContent} />
      );
      
      const strongElements = container.querySelectorAll('strong');
      const emElements = container.querySelectorAll('em');
      
      expect(strongElements.length).toBeGreaterThanOrEqual(2);
      expect(emElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags', () => {
      const maliciousContent = '<p>Safe content</p><script>alert("XSS")</script>';
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={maliciousContent} />
      );
      
      const scriptElement = container.querySelector('script');
      expect(scriptElement).toBeNull();
      
      // Safe content should still be rendered
      const pElement = container.querySelector('.prose p');
      expect(pElement).toBeTruthy();
      expect(pElement?.textContent).toBe('Safe content');
    });

    it('should sanitize onclick attributes', () => {
      const maliciousContent = '<p onclick="alert(\'XSS\')">Click me</p>';
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={maliciousContent} />
      );
      
      const pElement = container.querySelector('.prose p');
      expect(pElement).toBeTruthy();
      expect(pElement?.getAttribute('onclick')).toBeNull();
      expect(pElement?.textContent).toBe('Click me');
    });

    it('should sanitize javascript: URLs in links', () => {
      const maliciousContent = '<a href="javascript:alert(\'XSS\')">Click me</a>';
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={maliciousContent} />
      );
      
      const aElement = container.querySelector('a');
      // DOMPurify should either remove the link or sanitize the href
      if (aElement) {
        const href = aElement.getAttribute('href');
        // href should either be null or not contain javascript:
        if (href !== null) {
          expect(href).not.toContain('javascript:');
        }
      }
    });

    it('should sanitize onerror attributes in images', () => {
      const maliciousContent = '<img src="invalid.jpg" onerror="alert(\'XSS\')" alt="Test">';
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={maliciousContent} />
      );
      
      const imgElement = container.querySelector('img');
      if (imgElement) {
        expect(imgElement.getAttribute('onerror')).toBeNull();
      }
    });

    it('should remove dangerous tags like iframe', () => {
      const maliciousContent = '<p>Safe content</p><iframe src="http://evil.com"></iframe>';
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={maliciousContent} />
      );
      
      const iframeElement = container.querySelector('iframe');
      expect(iframeElement).toBeNull();
    });

    it('should remove style tags with malicious CSS', () => {
      const maliciousContent = '<p>Safe content</p><style>body { display: none; }</style>';
      
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent={maliciousContent} />
      );
      
      const styleElement = container.querySelector('style');
      expect(styleElement).toBeNull();
    });
  });

  describe('Empty Content Handling', () => {
    it('should handle empty HTML content gracefully', () => {
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent="" />
      );
      
      const titleElement = container.querySelector('h1');
      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toBe('Test Lesson');
      
      const contentElement = container.querySelector('.prose');
      expect(contentElement).toBeTruthy();
    });

    it('should handle whitespace-only content', () => {
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent="   \n\t   " />
      );
      
      const titleElement = container.querySelector('h1');
      expect(titleElement).toBeTruthy();
      
      const contentElement = container.querySelector('.prose');
      expect(contentElement).toBeTruthy();
    });

    it('should handle content with only empty tags', () => {
      const { container } = render(
        <TextLessonContent title="Test Lesson" htmlContent="<p></p><div></div>" />
      );
      
      const titleElement = container.querySelector('h1');
      expect(titleElement).toBeTruthy();
      
      const contentElement = container.querySelector('.prose');
      expect(contentElement).toBeTruthy();
    });
  });

  describe('Title Rendering', () => {
    it('should render title as h1 element', () => {
      const { container } = render(
        <TextLessonContent title="My Lesson Title" htmlContent="<p>Content</p>" />
      );
      
      const titleElement = container.querySelector('h1');
      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toBe('My Lesson Title');
    });

    it('should render title with special characters', () => {
      const title = 'Lesson: "Advanced" Topics & More';
      const { container } = render(
        <TextLessonContent title={title} htmlContent="<p>Content</p>" />
      );
      
      const titleElement = container.querySelector('h1');
      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toBe(title);
    });

    it('should render title with numbers and symbols', () => {
      const title = 'Lesson #5: 100% Complete!';
      const { container } = render(
        <TextLessonContent title={title} htmlContent="<p>Content</p>" />
      );
      
      const titleElement = container.querySelector('h1');
      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toBe(title);
    });
  });

  describe('Layout and Structure', () => {
    it('should apply prose class to content container', () => {
      const { container } = render(
        <TextLessonContent title="Test" htmlContent="<p>Content</p>" />
      );
      
      const proseElement = container.querySelector('.prose');
      expect(proseElement).toBeTruthy();
    });

    it('should render title before content in DOM', () => {
      const { container } = render(
        <TextLessonContent title="Test" htmlContent="<p>Content</p>" />
      );
      
      const h1 = container.querySelector('h1');
      const prose = container.querySelector('.prose');
      
      expect(h1).toBeTruthy();
      expect(prose).toBeTruthy();
      
      // Check DOM order
      const parent = h1?.parentElement;
      const children = Array.from(parent?.children || []);
      const h1Index = children.indexOf(h1!);
      const proseIndex = children.indexOf(prose!);
      
      expect(h1Index).toBeLessThan(proseIndex);
    });

    it('should have proper container structure', () => {
      const { container } = render(
        <TextLessonContent title="Test" htmlContent="<p>Content</p>" />
      );
      
      // Should have a main container div
      const mainDiv = container.firstChild;
      expect(mainDiv).toBeTruthy();
      
      // Should contain both title and content
      const h1 = container.querySelector('h1');
      const prose = container.querySelector('.prose');
      expect(h1).toBeTruthy();
      expect(prose).toBeTruthy();
    });
  });
});
