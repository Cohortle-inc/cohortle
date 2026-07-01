/**
 * Property-Based Tests: Video URL Helpers
 * Feature: student-lesson-viewer-web
 * 
 * Tests for YouTube URL detection and transformation utilities
 */

import fc from 'fast-check';
import {
  isYouTubeUrl,
  isBunnyStreamUrl,
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  extractBunnyStreamIds,
  getBunnyStreamEmbedUrl,
} from '@/lib/utils/videoUrlHelpers';

describe('Feature: student-lesson-viewer-web - Video URL Helpers', () => {
  /**
   * Property 17: Lesson type detection from YouTube URLs
   * **Validates: Requirements 3.1, 11.1**
   * 
   * For any lesson with a media URL matching YouTube URL patterns
   * (youtube.com, youtu.be), the detected lesson type should be 'video'.
   * 
   * This property verifies that:
   * 1. All YouTube URL formats are correctly identified
   * 2. The detection is consistent across different URL patterns
   * 3. Both full and short YouTube URLs are recognized
   */
  describe('Property 17: Lesson type detection from YouTube URLs', () => {
    // Generator for realistic YouTube video IDs
    // YouTube video IDs are 11 characters: alphanumeric, hyphens, and underscores
    const youtubeVideoIdArbitrary = fc.array(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
      ),
      { minLength: 11, maxLength: 11 }
    ).map(chars => chars.join(''));

    it('should detect youtube.com/watch URLs as YouTube', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            expect(isYouTubeUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect youtu.be short URLs as YouTube', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://youtu.be/${videoId}`;
            expect(isYouTubeUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect youtube.com/embed URLs as YouTube', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://www.youtube.com/embed/${videoId}`;
            expect(isYouTubeUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect mobile youtube URLs as YouTube', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://m.youtube.com/watch?v=${videoId}`;
            expect(isYouTubeUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not detect non-YouTube URLs as YouTube', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.includes('youtube') && !url.includes('youtu.be')
          ),
          (url) => {
            expect(isYouTubeUrl(url)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 28: YouTube embed URL transformation
   * **Validates: Requirements 3.1**
   * 
   * For any YouTube URL (in various formats: watch?v=, youtu.be/, embed/),
   * the system should extract the video ID and generate a valid embed URL
   * in the format `https://www.youtube.com/embed/{videoId}`.
   * 
   * This property verifies that:
   * 1. Video IDs are correctly extracted from all URL formats
   * 2. The embed URL is consistently formatted
   * 3. The transformation is idempotent (embed URLs remain unchanged)
   * 
   * Note: YouTube video IDs are 11 characters long and consist of alphanumeric
   * characters, hyphens, and underscores.
   */
  describe('Property 28: YouTube embed URL transformation', () => {
    // Generator for realistic YouTube video IDs
    const youtubeVideoIdArbitrary = fc.array(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
      ),
      { minLength: 11, maxLength: 11 }
    ).map(chars => chars.join(''));

    it('should extract video ID from youtube.com/watch URLs', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            const extractedId = extractYouTubeVideoId(url);
            expect(extractedId).toBe(videoId);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should extract video ID from youtu.be short URLs', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://youtu.be/${videoId}`;
            const extractedId = extractYouTubeVideoId(url);
            expect(extractedId).toBe(videoId);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should extract video ID from youtube.com/embed URLs', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://www.youtube.com/embed/${videoId}`;
            const extractedId = extractYouTubeVideoId(url);
            expect(extractedId).toBe(videoId);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should transform youtube.com/watch URLs to embed format', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            const embedUrl = getYouTubeEmbedUrl(url);
            expect(embedUrl).toBe(`https://www.youtube.com/embed/${videoId}`);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should transform youtu.be URLs to embed format', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const url = `https://youtu.be/${videoId}`;
            const embedUrl = getYouTubeEmbedUrl(url);
            expect(embedUrl).toBe(`https://www.youtube.com/embed/${videoId}`);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve embed URLs (idempotent transformation)', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          (videoId) => {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const transformedUrl = getYouTubeEmbedUrl(embedUrl);
            expect(transformedUrl).toBe(embedUrl);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle URLs with query parameters', () => {
      fc.assert(
        fc.property(
          youtubeVideoIdArbitrary,
          fc.string({ minLength: 1, maxLength: 20 }),
          (videoId, param) => {
            const url = `https://www.youtube.com/watch?v=${videoId}&t=${param}`;
            const embedUrl = getYouTubeEmbedUrl(url);
            expect(embedUrl).toBe(`https://www.youtube.com/embed/${videoId}`);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return original URL if video ID cannot be extracted', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.includes('youtube') && !url.includes('youtu.be')
          ),
          (url) => {
            const embedUrl = getYouTubeEmbedUrl(url);
            expect(embedUrl).toBe(url);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Additional property tests for BunnyStream URL detection
   * These support the lesson type detection functionality
   */
  describe('BunnyStream URL Detection', () => {
    // Generator for realistic BunnyStream IDs (alphanumeric and hyphens, no slashes)
    const bunnyStreamIdArbitrary = fc.stringMatching(/^[a-zA-Z0-9-]{5,20}$/);

    it('should detect iframe.mediadelivery.net URLs as BunnyStream', () => {
      fc.assert(
        fc.property(
          bunnyStreamIdArbitrary,
          bunnyStreamIdArbitrary,
          (libraryId, videoId) => {
            const url = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
            expect(isBunnyStreamUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect video.bunnycdn.com URLs as BunnyStream', () => {
      fc.assert(
        fc.property(
          bunnyStreamIdArbitrary,
          bunnyStreamIdArbitrary,
          (libraryId, videoId) => {
            const url = `https://video.bunnycdn.com/${libraryId}/${videoId}/playlist.m3u8`;
            expect(isBunnyStreamUrl(url)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not detect non-BunnyStream URLs as BunnyStream', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.includes('iframe.mediadelivery.net') && 
            !url.includes('bunnycdn.com')
          ),
          (url) => {
            expect(isBunnyStreamUrl(url)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property tests for BunnyStream embed URL transformation
   */
  describe('BunnyStream Embed URL Transformation', () => {
    // Generator for realistic BunnyStream IDs (alphanumeric and hyphens, no slashes)
    const bunnyStreamIdArbitrary = fc.stringMatching(/^[a-zA-Z0-9-]{5,20}$/);

    it('should extract IDs from iframe.mediadelivery.net URLs', () => {
      fc.assert(
        fc.property(
          bunnyStreamIdArbitrary,
          bunnyStreamIdArbitrary,
          (libraryId, videoId) => {
            const url = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
            const ids = extractBunnyStreamIds(url);
            expect(ids).toEqual({ libraryId, videoId });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should extract IDs from video.bunnycdn.com URLs', () => {
      fc.assert(
        fc.property(
          bunnyStreamIdArbitrary,
          bunnyStreamIdArbitrary,
          (libraryId, videoId) => {
            const url = `https://video.bunnycdn.com/${libraryId}/${videoId}/playlist.m3u8`;
            const ids = extractBunnyStreamIds(url);
            expect(ids).toEqual({ libraryId, videoId });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should transform bunnycdn URLs to embed format', () => {
      fc.assert(
        fc.property(
          bunnyStreamIdArbitrary,
          bunnyStreamIdArbitrary,
          (libraryId, videoId) => {
            const url = `https://video.bunnycdn.com/${libraryId}/${videoId}/playlist.m3u8`;
            const embedUrl = getBunnyStreamEmbedUrl(url);
            expect(embedUrl).toBe(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve embed URLs (idempotent transformation)', () => {
      fc.assert(
        fc.property(
          bunnyStreamIdArbitrary,
          bunnyStreamIdArbitrary,
          (libraryId, videoId) => {
            const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
            const transformedUrl = getBunnyStreamEmbedUrl(embedUrl);
            expect(transformedUrl).toBe(embedUrl);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return original URL if IDs cannot be extracted', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }).filter(url => 
            !url.includes('iframe.mediadelivery.net') && 
            !url.includes('bunnycdn.com')
          ),
          (url) => {
            const embedUrl = getBunnyStreamEmbedUrl(url);
            expect(embedUrl).toBe(url);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Edge case tests for robustness
   */
  describe('Edge Cases', () => {
    it('should handle empty strings gracefully', () => {
      expect(isYouTubeUrl('')).toBe(false);
      expect(isBunnyStreamUrl('')).toBe(false);
      expect(extractYouTubeVideoId('')).toBe(null);
      expect(getYouTubeEmbedUrl('')).toBe('');
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(isYouTubeUrl(null as any)).toBe(false);
      expect(isBunnyStreamUrl(undefined as any)).toBe(false);
      expect(extractYouTubeVideoId(null as any)).toBe(null);
    });

    it('should handle malformed URLs gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (randomString) => {
            // Should not throw errors
            expect(() => isYouTubeUrl(randomString)).not.toThrow();
            expect(() => isBunnyStreamUrl(randomString)).not.toThrow();
            expect(() => extractYouTubeVideoId(randomString)).not.toThrow();
            expect(() => getYouTubeEmbedUrl(randomString)).not.toThrow();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
