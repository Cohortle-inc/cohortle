/**
 * YouTube URL Helper Utilities
 * Handles YouTube URL parsing and embed URL generation
 */

/**
 * Extracts YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Converts a YouTube URL to an embed URL
 * Adds parameters to minimize YouTube branding and related videos
 */
export const getYouTubeEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    return url; // Return original URL if parsing fails
  }

  // Parameters:
  // rel=0 - Don't show related videos from other channels
  // modestbranding=1 - Minimize YouTube branding
  // playsinline=1 - Play inline on iOS
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
};

/**
 * Validates if a string is a valid YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Validates YouTube URL format and returns error message if invalid
 */
export const validateYouTubeUrl = (url: string): string | null => {
  if (!url || url.trim() === '') {
    return 'YouTube URL is required';
  }

  if (!isYouTubeUrl(url)) {
    return 'Please enter a valid YouTube URL';
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return 'Could not extract video ID from URL. Please check the format.';
  }

  return null; // Valid
};
