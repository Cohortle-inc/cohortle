/**
 * Video URL Helper Functions
 * 
 * Utilities for detecting and transforming video URLs from various platforms
 * (YouTube, BunnyStream) for embedding in the lesson viewer.
 */

/**
 * Detects if a URL is a YouTube video URL
 * 
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * 
 * @param url - The URL to check
 * @returns true if the URL is a YouTube URL, false otherwise
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    return hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'youtube-nocookie.com';
  } catch {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com');
  }
}

/**
 * Detects if a URL is a BunnyStream video URL
 * 
 * BunnyStream URLs use the format:
 * - https://iframe.mediadelivery.net/embed/{library_id}/{video_id}
 * - https://video.bunnycdn.com/{library_id}/{video_id}/playlist.m3u8
 * 
 * @param url - The URL to check
 * @returns true if the URL is a BunnyStream URL, false otherwise
 */
export function isBunnyStreamUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  return url.includes('iframe.mediadelivery.net') || 
         url.includes('video.bunnycdn.com') ||
         url.includes('bunnycdn.com');
}

/**
 * Extracts the video ID from various YouTube URL formats
 * 
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/v/VIDEO_ID
 * - m.youtube.com/watch?v=VIDEO_ID
 * 
 * @param url - The YouTube URL
 * @returns The video ID if found, null otherwise
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const watchId = parsed.searchParams.get('v');
      if (watchId) return watchId;
    }

    if (hostname === 'youtu.be') {
      const shortId = parsed.pathname.split('/').filter(Boolean)[0];
      if (shortId) return shortId;
    }

    if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if ((parts[0] === 'embed' || parts[0] === 'v' || parts[0] === 'shorts') && parts[1]) {
        return parts[1];
      }
    }
  } catch {
    // Fall through to regex-based extraction for malformed but recoverable strings.
  }

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  const watchPattern = /(?:youtube(?:-nocookie)?\.com\/watch\?[^#\s]*v=)([^&#\s]+)/;
  const watchMatch = url.match(watchPattern);
  if (watchMatch && watchMatch[1].trim().length > 0) {
    return watchMatch[1];
  }

  // Pattern 2: youtu.be/VIDEO_ID
  const shortPattern = /(?:youtu\.be\/)([^?#\s]+)/;
  const shortMatch = url.match(shortPattern);
  if (shortMatch && shortMatch[1].trim().length > 0) {
    return shortMatch[1];
  }

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedPattern = /(?:youtube(?:-nocookie)?\.com\/embed\/)([^?#\s]+)/;
  const embedMatch = url.match(embedPattern);
  if (embedMatch && embedMatch[1].trim().length > 0) {
    return embedMatch[1];
  }

  // Pattern 4: youtube.com/v/VIDEO_ID
  const vPattern = /(?:youtube(?:-nocookie)?\.com\/v\/)([^?#\s]+)/;
  const vMatch = url.match(vPattern);
  if (vMatch && vMatch[1].trim().length > 0) {
    return vMatch[1];
  }

  return null;
}

/**
 * Extracts a YouTube playlist ID from playlist and watch URLs.
 */
export function extractYouTubePlaylistId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    const playlistId = parsed.searchParams.get('list');
    return playlistId || null;
  } catch {
    const match = url.match(/[?&]list=([^&#\s]+)/);
    return match?.[1] || null;
  }
}

/**
 * Converts a YouTube URL to an embed-ready URL
 * 
 * Takes any YouTube URL format and converts it to the standard embed format:
 * https://www.youtube.com/embed/VIDEO_ID
 * 
 * @param url - The YouTube URL in any format
 * @returns The embed-ready URL, or the original URL if video ID cannot be extracted
 */
export function getYouTubeEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  const videoId = extractYouTubeVideoId(url);
  const playlistId = extractYouTubePlaylistId(url);
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  if (playlistId) {
    params.set('list', playlistId);
  }

  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  }

  if (playlistId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`;
  }

  // If we can't extract the video ID, return the original URL
  return url;
}

/**
 * Extracts library ID and video ID from BunnyStream URLs
 * 
 * Supports:
 * - iframe.mediadelivery.net/embed/{library_id}/{video_id}
 * - video.bunnycdn.com/{library_id}/{video_id}/playlist.m3u8
 * 
 * @param url - The BunnyStream URL
 * @returns Object with libraryId and videoId if found, null otherwise
 */
export function extractBunnyStreamIds(url: string): { libraryId: string; videoId: string } | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Pattern 1: iframe.mediadelivery.net/embed/{library_id}/{video_id}
  // Match non-slash characters for IDs
  const embedPattern = /iframe\.mediadelivery\.net\/embed\/([^/?]+)\/([^/?]+)/;
  const embedMatch = url.match(embedPattern);
  if (embedMatch && embedMatch[1] && embedMatch[2]) {
    return {
      libraryId: embedMatch[1],
      videoId: embedMatch[2]
    };
  }
  
  // Pattern 2: video.bunnycdn.com/{library_id}/{video_id}/
  // Match non-slash characters for IDs
  const cdnPattern = /video\.bunnycdn\.com\/([^/?]+)\/([^/?]+)/;
  const cdnMatch = url.match(cdnPattern);
  if (cdnMatch && cdnMatch[1] && cdnMatch[2]) {
    return {
      libraryId: cdnMatch[1],
      videoId: cdnMatch[2]
    };
  }
  
  return null;
}

/**
 * Converts a BunnyStream URL to an embed-ready URL
 * 
 * Takes any BunnyStream URL format and converts it to the standard embed format:
 * https://iframe.mediadelivery.net/embed/{library_id}/{video_id}
 * 
 * @param url - The BunnyStream URL in any format
 * @returns The embed-ready URL, or the original URL if IDs cannot be extracted
 */
export function getBunnyStreamEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  // If already an embed URL, return as-is
  if (url.includes('iframe.mediadelivery.net/embed/')) {
    return url;
  }
  
  const ids = extractBunnyStreamIds(url);
  
  if (!ids) {
    // If we can't extract the IDs, return the original URL
    return url;
  }
  
  return `https://iframe.mediadelivery.net/embed/${ids.libraryId}/${ids.videoId}`;
}
