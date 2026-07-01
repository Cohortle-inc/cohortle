/**
 * Property-Based Test: Output Sanitization
 * 
 * Property 20: All user-generated content is sanitized before display
 * 
 * This test verifies that the system properly sanitizes all user-generated
 * content to prevent XSS attacks and other injection vulnerabilities.
 * 
 * Requirements: 13.6 - Output sanitization to prevent XSS attacks
 */

import fc from 'fast-check';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeName,
  sanitizeUrl,
  sanitizeMarkdown,
  sanitizeContent,
} from '@/lib/utils/sanitize';

describe('Property 20: Output Sanitization', () => {
  /**
   * Property: Sanitized HTML should never contain script tags
   */
  test('sanitizeHtml should always remove script tags', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (before, after) => {
          const maliciousHtml = `${before}<script>alert("XSS")</script>${after}`;
          const sanitized = sanitizeHtml(maliciousHtml);
          
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('</script>');
          expect(sanitized).not.toContain('alert(');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized HTML should never contain event handlers
   */
  test('sanitizeHtml should always remove event handlers', () => {
    const eventHandlers = [
      'onclick',
      'onerror',
      'onload',
      'onmouseover',
      'onfocus',
      'onblur'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...eventHandlers),
        fc.string({ minLength: 1, maxLength: 50 }),
        (handler, content) => {
          const maliciousHtml = `<div ${handler}="alert('XSS')">${content}</div>`;
          const sanitized = sanitizeHtml(maliciousHtml);
          
          expect(sanitized.toLowerCase()).not.toContain(handler);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Sanitized text should escape all HTML special characters
   */
  test('sanitizeText should escape HTML special characters', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const sanitized = sanitizeText(input);
          
          // If input contains special chars, they should be escaped
          if (input.includes('<')) {
            expect(sanitized).toContain('&lt;');
          }
          if (input.includes('>')) {
            expect(sanitized).toContain('&gt;');
          }
          if (input.includes('&')) {
            expect(sanitized).toContain('&amp;');
          }
          if (input.includes('"')) {
            expect(sanitized).toContain('&quot;');
          }
          
          // Should never contain unescaped HTML
          expect(sanitized).not.toMatch(/<[^&]/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized names should never contain HTML tags
   */
  test('sanitizeName should remove all HTML tags', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (name, tag) => {
          const maliciousName = `<${tag}>${name}</${tag}>`;
          const sanitized = sanitizeName(maliciousName);
          
          expect(sanitized).not.toContain(`<${tag}>`);
          expect(sanitized).not.toContain(`</${tag}>`);
          expect(sanitized).toContain(name);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Sanitized URLs should only allow safe protocols
   */
  test('sanitizeUrl should reject dangerous protocols', () => {
    const dangerousProtocols = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'about:'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...dangerousProtocols),
        fc.string({ minLength: 1, maxLength: 50 }),
        (protocol, payload) => {
          const maliciousUrl = `${protocol}${payload}`;
          const sanitized = sanitizeUrl(maliciousUrl);
          
          // Should return empty string for dangerous protocols
          expect(sanitized).toBe('');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Sanitized URLs should allow safe protocols
   */
  test('sanitizeUrl should allow safe protocols', () => {
    const safeProtocols = ['https://', 'http://', 'mailto:'];

    fc.assert(
      fc.property(
        fc.constantFrom(...safeProtocols),
        fc.webUrl(),
        (protocol, url) => {
          const safeUrl = url.replace(/^https?:\/\//, protocol);
          const sanitized = sanitizeUrl(safeUrl);
          
          // Should preserve safe URLs
          if (protocol === 'https://' || protocol === 'http://') {
            expect(sanitized).toBe(safeUrl);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Sanitized markdown should escape HTML before processing
   */
  test('sanitizeMarkdown should escape HTML in markdown', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (content) => {
          const maliciousMarkdown = `<script>alert("XSS")</script>${content}`;
          const sanitized = sanitizeMarkdown(maliciousMarkdown);
          
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).toContain('&lt;script&gt;');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Sanitized markdown links should validate URLs
   */
  test('sanitizeMarkdown should validate URLs in links', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (text) => {
          const maliciousMarkdown = `[${text}](javascript:alert("XSS"))`;
          const sanitized = sanitizeMarkdown(maliciousMarkdown);
          
          // Should not create a link with javascript: protocol
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('<a');
          // Should still contain the text
          expect(sanitized).toContain(text);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: sanitizeContent should route to correct sanitizer
   */
  test('sanitizeContent should apply correct sanitization based on type', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (content) => {
          const maliciousContent = `<script>${content}</script>`;
          
          // HTML type should remove scripts
          const htmlSanitized = sanitizeContent(maliciousContent, 'html');
          expect(htmlSanitized).not.toContain('<script>');
          
          // Text type should escape
          const textSanitized = sanitizeContent(maliciousContent, 'text');
          expect(textSanitized).toContain('&lt;script&gt;');
          
          // Default should be text
          const defaultSanitized = sanitizeContent(maliciousContent);
          expect(defaultSanitized).toContain('&lt;script&gt;');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty inputs should return empty outputs
   */
  test('all sanitizers should handle empty strings', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeText('')).toBe('');
    expect(sanitizeName('')).toBe('');
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeMarkdown('')).toBe('');
    expect(sanitizeContent('')).toBe('');
  });

  /**
   * Property: Sanitization should be idempotent
   */
  test('sanitization should be idempotent', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (content) => {
          const once = sanitizeText(content);
          const twice = sanitizeText(once);
          
          // Sanitizing twice should give same result
          expect(twice).toBe(once);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Sanitization should preserve safe content
   */
  test('sanitizeHtml should preserve safe HTML', () => {
    const safeHtml = fc.oneof(
      fc.constant('<p>Hello world</p>'),
      fc.constant('<strong>Bold text</strong>'),
      fc.constant('<em>Italic text</em>'),
      fc.constant('<a href="https://example.com">Link</a>'),
      fc.constant('<ul><li>Item 1</li><li>Item 2</li></ul>')
    );

    fc.assert(
      fc.property(safeHtml, (html) => {
        const sanitized = sanitizeHtml(html);
        
        // Safe HTML should be preserved (though may be modified slightly)
        expect(sanitized).toBeTruthy();
        expect(sanitized.length).toBeGreaterThan(0);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: XSS attack vectors should always be neutralized
   */
  test('should neutralize common XSS attack vectors', () => {
    const xssVectors = [
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<marquee onstart=alert("XSS")>',
      '<div style="background:url(javascript:alert(\'XSS\'))">',
      '"><script>alert("XSS")</script>',
      '\';alert("XSS");//'
    ];

    xssVectors.forEach(vector => {
      const sanitized = sanitizeHtml(vector);
      
      // Should not contain alert
      expect(sanitized).not.toContain('alert(');
      expect(sanitized).not.toContain('alert("XSS")');
      
      // Should not contain event handlers
      expect(sanitized.toLowerCase()).not.toMatch(/on\w+=/);
      
      // Should not contain javascript: protocol
      expect(sanitized).not.toContain('javascript:');
    });
  });
});
