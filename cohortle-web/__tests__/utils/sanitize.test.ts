import {
  sanitizeHtml,
  sanitizeText,
  sanitizeName,
  sanitizeUrl,
  sanitizeMarkdown,
  sanitizeContent,
} from '@/lib/utils/sanitize';

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const output = sanitizeHtml(input);
    expect(output).toContain('Hello');
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('Hello');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('sanitizeText', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const output = sanitizeText(input);
    expect(output).toContain('&lt;');
    expect(output).toContain('&gt;');
  });

  it('should escape ampersands', () => {
    const input = 'Tom & Jerry';
    const output = sanitizeText(input);
    expect(output).toContain('&amp;');
  });

  it('should handle empty input', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('sanitizeName', () => {
  it('should remove HTML tags from names', () => {
    const input = '<script>alert("XSS")</script>John Doe';
    const output = sanitizeName(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('John Doe');
  });

  it('should trim whitespace', () => {
    const input = '  John Doe  ';
    const output = sanitizeName(input);
    expect(output).toBe('John Doe');
  });

  it('should handle empty input', () => {
    expect(sanitizeName('')).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('should allow https URLs', () => {
    const input = 'https://example.com';
    const output = sanitizeUrl(input);
    expect(output).toBe('https://example.com');
  });

  it('should allow relative URLs', () => {
    const input = '/path/to/page';
    const output = sanitizeUrl(input);
    expect(output).toBe('/path/to/page');
  });

  it('should reject javascript URLs', () => {
    const input = 'javascript:alert("XSS")';
    const output = sanitizeUrl(input);
    expect(output).toBe('');
  });

  it('should handle empty input', () => {
    expect(sanitizeUrl('')).toBe('');
  });
});

describe('sanitizeMarkdown', () => {
  it('should convert bold markdown to HTML', () => {
    const input = '**bold text**';
    const output = sanitizeMarkdown(input);
    expect(output).toContain('bold text');
  });

  it('should escape HTML in markdown', () => {
    const input = '<script>alert("XSS")</script>';
    const output = sanitizeMarkdown(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;');
  });

  it('should handle empty input', () => {
    expect(sanitizeMarkdown('')).toBe('');
  });
});

describe('sanitizeContent', () => {
  it('should sanitize HTML content', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const output = sanitizeContent(input, 'html');
    expect(output).toContain('Hello');
    expect(output).not.toContain('<script>');
  });

  it('should sanitize text content', () => {
    const input = '<script>alert("XSS")</script>';
    const output = sanitizeContent(input, 'text');
    expect(output).toContain('&lt;');
  });

  it('should default to text sanitization', () => {
    const input = '<script>alert("XSS")</script>';
    const output = sanitizeContent(input);
    expect(output).toContain('&lt;');
  });
});
