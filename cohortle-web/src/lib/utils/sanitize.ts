/**
 * Output sanitization utilities for user-generated content
 * 
 * This module provides functions to sanitize user-generated content
 * before displaying it to prevent XSS attacks.
 * 
 * Requirements: 13.6 - Output sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for DOMPurify
 */
const PURIFY_CONFIG = {
  // Allow only safe HTML tags
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  // Ensure links open in new tab and have noopener noreferrer
  ADD_ATTR: ['target', 'rel'],
  // Remove any data attributes
  FORBID_ATTR: ['style', 'onerror', 'onload'],
  // Keep content safe
  KEEP_CONTENT: true,
  // Return a string
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitize HTML content for safe display
 * Allows basic formatting tags but removes any potentially dangerous content
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for display
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

/**
 * Sanitize plain text content by escaping HTML special characters
 * Use this for content that should be displayed as plain text
 * 
 * @param text - The text string to sanitize
 * @returns Escaped text string safe for display
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user name for display
 * Removes any HTML and trims whitespace
 * 
 * @param name - The name to sanitize
 * @returns Sanitized name string
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  
  // Remove any HTML tags and trim
  const stripped = name.replace(/<[^>]*>/g, '').trim();
  
  // Escape any remaining special characters
  return sanitizeText(stripped);
}

/**
 * Sanitize URL for safe use in href attributes
 * Only allows http, https, and mailto protocols
 * 
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // Check for allowed protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const parsed = new URL(trimmed);
    if (allowedProtocols.includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    // If URL parsing fails, check if it's a relative URL
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
  }
  
  // If we get here, the URL is not safe
  return '';
}

/**
 * Sanitize markdown-like content for display
 * Converts basic markdown to safe HTML
 * 
 * @param content - The markdown content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeMarkdown(content: string): string {
  if (!content) return '';
  
  // First escape HTML
  let sanitized = sanitizeText(content);
  
  // Convert basic markdown patterns to HTML
  // Bold: **text** or __text__
  sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  sanitized = sanitized.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
  sanitized = sanitized.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Code: `code`
  sanitized = sanitized.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Links: [text](url)
  sanitized = sanitized.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text, url) => {
      const safeUrl = sanitizeUrl(url);
      if (safeUrl) {
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return text;
    }
  );
  
  // Line breaks
  sanitized = sanitized.replace(/\n/g, '<br>');
  
  return sanitized;
}

/**
 * Sanitize user-generated content based on content type
 * This is the main function to use for sanitizing content
 * 
 * @param content - The content to sanitize
 * @param type - The type of content ('html', 'text', 'markdown', 'name', 'url')
 * @returns Sanitized content safe for display
 */
export function sanitizeContent(
  content: string,
  type: 'html' | 'text' | 'markdown' | 'name' | 'url' = 'text'
): string {
  switch (type) {
    case 'html':
      return sanitizeHtml(content);
    case 'markdown':
      return sanitizeMarkdown(content);
    case 'name':
      return sanitizeName(content);
    case 'url':
      return sanitizeUrl(content);
    case 'text':
    default:
      return sanitizeText(content);
  }
}
