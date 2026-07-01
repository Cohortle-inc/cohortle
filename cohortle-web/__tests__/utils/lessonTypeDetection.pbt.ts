/**
 * Property-Based Tests: Lesson Type Detection
 * Feature: student-lesson-viewer-web
 * 
 * Tests for lesson type detection based on content and media URLs
 */

import fc from 'fast-check';
import { detectLessonType, isPdfUrl } from '@/lib/utils/lessonTypeDetection';
import { Lesson } from '@/types/lesson';

describe('Feature: student-lesson-viewer-web - Lesson Type Detection', () => {
  /**
   * Property 18: Lesson type detection from BunnyStream URLs
   * **Validates: Requirements 11.2**
   * 
   * For any lesson with a media URL containing 'iframe.mediadelivery.net',
   * the detected lesson type should be 'video'.
   * 
   * This property verifies that:
   * 1. BunnyStream URLs are correctly identified as video lessons
   * 2. The detection is consistent across different BunnyStream URL formats
   */
  describe('Property 18: Lesson type detection from BunnyStream URLs', () => {
    it('should detect BunnyStream URLs as video type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.string({ minLength: 5, maxLength: 20 }),
          (libraryId, videoId) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('video');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize explicit lesson_type over BunnyStream URL detection', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.constantFrom('text', 'pdf', 'link'),
          (libraryId, videoId, explicitType) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
              lesson_type: explicitType as any,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe(explicitType);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 19: Lesson type detection from PDF URLs
   * **Validates: Requirements 11.3**
   * 
   * For any lesson with a media URL ending in '.pdf',
   * the detected lesson type should be 'pdf'.
   * 
   * This property verifies that:
   * 1. PDF URLs with .pdf extension are correctly identified
   * 2. PDF URLs with content-type parameter are correctly identified
   * 3. Case-insensitive detection works properly
   */
  describe('Property 19: Lesson type detection from PDF URLs', () => {
    it('should detect .pdf extension URLs as pdf type', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          (baseUrl) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: `${baseUrl}/document.pdf`,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('pdf');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect .PDF extension (uppercase) as pdf type', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          (baseUrl) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: `${baseUrl}/document.PDF`,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('pdf');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect content-type=application/pdf URLs as pdf type', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          (baseUrl) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: `${baseUrl}/document?content-type=application/pdf`,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('pdf');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize explicit lesson_type over PDF URL detection', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          fc.constantFrom('text', 'video', 'link'),
          (baseUrl, explicitType) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: `${baseUrl}/document.pdf`,
              lesson_type: explicitType as any,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe(explicitType);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 20: Lesson type detection fallback for links
   * **Validates: Requirements 11.4**
   * 
   * For any lesson with a media URL that doesn't match video or PDF patterns,
   * the detected lesson type should be 'link'.
   * 
   * This property verifies that:
   * 1. Non-video, non-PDF URLs are classified as links
   * 2. The fallback mechanism works correctly
   */
  describe('Property 20: Lesson type detection fallback for links', () => {
    it('should detect non-video, non-PDF URLs as link type', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.includes('youtube') && 
            !url.includes('youtu.be') && 
            !url.includes('iframe.mediadelivery.net') &&
            !url.toLowerCase().endsWith('.pdf') &&
            !url.includes('content-type=application/pdf')
          ),
          (url) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: url,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('link');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect external resource URLs as link type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.com/article',
            'https://docs.example.com/guide',
            'https://blog.example.com/post/123',
            'https://resources.example.com/page.html'
          ),
          (url) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: url,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('link');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize explicit lesson_type over link URL detection', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.includes('youtube') && 
            !url.includes('youtu.be') && 
            !url.includes('iframe.mediadelivery.net') &&
            !url.toLowerCase().endsWith('.pdf')
          ),
          fc.constantFrom('text', 'video', 'pdf'),
          (url, explicitType) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              media: url,
              lesson_type: explicitType as any,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe(explicitType);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 21: Lesson type detection for text-only lessons
   * **Validates: Requirements 11.5**
   * 
   * For any lesson with no media URL but with text content,
   * the detected lesson type should be 'text'.
   * 
   * This property verifies that:
   * 1. Lessons with only text content are classified as text lessons
   * 2. The text-only fallback works correctly
   * 3. Empty lessons default to text type
   */
  describe('Property 21: Lesson type detection for text-only lessons', () => {
    it('should detect lessons with only text content as text type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          (textContent) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              text: textContent,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('text');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect lessons with HTML text content as text type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<p>This is a paragraph</p>',
            '<h1>Title</h1><p>Content</p>',
            '<ul><li>Item 1</li><li>Item 2</li></ul>',
            '<div><strong>Bold</strong> and <em>italic</em></div>'
          ),
          (htmlContent) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              text: htmlContent,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('text');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should default to text type for lessons with no content', () => {
      const lesson: Lesson = {
        id: 1,
        name: 'Test Lesson',
        module_id: 1,
        order_number: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      
      const detectedType = detectLessonType(lesson);
      expect(detectedType).toBe('text');
    });

    it('should prioritize explicit lesson_type over text-only detection', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('video', 'pdf', 'link'),
          (textContent, explicitType) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              text: textContent,
              lesson_type: explicitType as any,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe(explicitType);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Additional tests for isPdfUrl helper function
   */
  describe('isPdfUrl Helper Function', () => {
    it('should detect .pdf extension URLs', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          (baseUrl) => {
            const url = `${baseUrl}/document.pdf`;
            expect(isPdfUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect content-type=application/pdf URLs', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          (baseUrl) => {
            const url = `${baseUrl}/document?content-type=application/pdf`;
            expect(isPdfUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not detect non-PDF URLs', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.toLowerCase().endsWith('.pdf') &&
            !url.includes('content-type=application/pdf')
          ),
          (url) => {
            expect(isPdfUrl(url)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle empty strings gracefully', () => {
      expect(isPdfUrl('')).toBe(false);
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(isPdfUrl(null as any)).toBe(false);
      expect(isPdfUrl(undefined as any)).toBe(false);
    });
  });

  /**
   * Edge cases and priority testing
   */
  describe('Edge Cases and Priority', () => {
    it('should always prioritize explicit lesson_type field', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('text', 'video', 'pdf', 'link', 'quiz', 'live-session'),
          fc.webUrl({ validSchemes: ['https'] }),
          fc.string({ minLength: 10, maxLength: 100 }),
          (explicitType, mediaUrl, textContent) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              text: textContent,
              media: mediaUrl,
              lesson_type: explicitType as any,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe(explicitType);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize media URL over text content', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.includes('youtube') && 
            !url.includes('youtu.be') && 
            !url.includes('iframe.mediadelivery.net') &&
            !url.toLowerCase().endsWith('.pdf')
          ),
          fc.string({ minLength: 10, maxLength: 100 }),
          (mediaUrl, textContent) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              text: textContent,
              media: mediaUrl,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            };
            
            const detectedType = detectLessonType(lesson);
            // Should be 'link' because media URL is present
            expect(detectedType).toBe('link');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 22: Lesson type detection for quiz lessons
   * **Validates: Requirements 1.18**
   * 
   * For any lesson with quiz_data containing questions,
   * the detected lesson type should be 'quiz'.
   * 
   * This property verifies that:
   * 1. Lessons with quiz data are classified as quiz lessons
   * 2. Quiz detection takes priority over media and text content
   */
  describe('Property 22: Lesson type detection for quiz lessons', () => {
    it('should detect lessons with quiz_data as quiz type', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom('multiple-choice', 'true-false', 'text-input'),
            question: fc.string({ minLength: 10 }),
            correctAnswer: fc.string(),
          }), { minLength: 1, maxLength: 10 }),
          (questions) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Quiz',
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
              quiz_data: {
                questions,
                allow_retakes: true,
              },
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('quiz');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize quiz detection over media URL', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom('multiple-choice', 'true-false', 'text-input'),
            question: fc.string({ minLength: 10 }),
            correctAnswer: fc.string(),
          }), { minLength: 1, maxLength: 5 }),
          (mediaUrl, questions) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Quiz',
              media: mediaUrl,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
              quiz_data: {
                questions,
                allow_retakes: true,
              },
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('quiz');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not detect quiz type if quiz_data has no questions', () => {
      const lesson: Lesson = {
        id: 1,
        name: 'Test Lesson',
        text: 'Some text content',
        module_id: 1,
        order_number: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        quiz_data: {
          questions: [],
          allow_retakes: true,
        },
      };
      
      const detectedType = detectLessonType(lesson);
      expect(detectedType).toBe('text');
    });
  });

  /**
   * Property 23: Lesson type detection for live session lessons
   * **Validates: Requirements 1.22**
   * 
   * For any lesson with live_session_data containing a scheduled_date,
   * the detected lesson type should be 'live-session'.
   * 
   * This property verifies that:
   * 1. Lessons with live session data are classified as live-session lessons
   * 2. Live session detection takes priority over media and text content
   */
  describe('Property 23: Lesson type detection for live session lessons', () => {
    it('should detect lessons with live_session_data as live-session type', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 30, max: 180 }),
          (scheduledDate, duration) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Live Session',
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
              live_session_data: {
                scheduled_date: scheduledDate.toISOString(),
                duration,
              },
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('live-session');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize live session detection over media URL', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 30, max: 180 }),
          (mediaUrl, scheduledDate, duration) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Live Session',
              media: mediaUrl,
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
              live_session_data: {
                scheduled_date: scheduledDate.toISOString(),
                duration,
              },
            };
            
            const detectedType = detectLessonType(lesson);
            expect(detectedType).toBe('live-session');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize quiz over live session when both are present', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            id: fc.string(),
            type: fc.constantFrom('multiple-choice', 'true-false', 'text-input'),
            question: fc.string({ minLength: 10 }),
            correctAnswer: fc.string(),
          }), { minLength: 1, maxLength: 5 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          (questions, scheduledDate) => {
            const lesson: Lesson = {
              id: 1,
              name: 'Test Lesson',
              module_id: 1,
              order_number: 1,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
              quiz_data: {
                questions,
                allow_retakes: true,
              },
              live_session_data: {
                scheduled_date: scheduledDate.toISOString(),
                duration: 60,
              },
            };
            
            const detectedType = detectLessonType(lesson);
            // Quiz should take priority based on the detection order
            expect(detectedType).toBe('quiz');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not detect live-session type if live_session_data has no scheduled_date', () => {
      const lesson: Lesson = {
        id: 1,
        name: 'Test Lesson',
        text: 'Some text content',
        module_id: 1,
        order_number: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        live_session_data: {
          scheduled_date: '',
          duration: 60,
        },
      };
      
      const detectedType = detectLessonType(lesson);
      expect(detectedType).toBe('text');
    });
  });
});
