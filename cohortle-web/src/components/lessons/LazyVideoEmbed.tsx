'use client';

import { useState } from 'react';

interface LazyVideoEmbedProps {
  embedUrl: string;
  title: string;
  platform: 'youtube' | 'bunnystream' | 'unknown';
  thumbnailUrl?: string;
  hasCaptions?: boolean;
  onError?: () => void;
}

/**
 * LazyVideoEmbed - Lazy loads video iframes with a click-to-play facade
 * 
 * Benefits:
 * - Reduces initial page load by ~500KB per video
 * - Improves Core Web Vitals (LCP, TBT)
 * - Saves bandwidth for users who don't watch the video
 * - Maintains full accessibility with keyboard support
 */
export function LazyVideoEmbed({
  embedUrl,
  title,
  platform,
  thumbnailUrl,
  hasCaptions = false,
  onError
}: LazyVideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate YouTube thumbnail if not provided
  const getYouTubeThumbnail = (url: string): string => {
    const videoIdMatch = url.match(/embed\/([^?]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      // Use maxresdefault for best quality, fallback to hqdefault
      return `https://i.ytimg.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
    }
    return '';
  };

  const thumbnail = thumbnailUrl || (platform === 'youtube' ? getYouTubeThumbnail(embedUrl) : '');

  const handleLoadVideo = () => {
    setIsLoaded(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Enter or Space to activate the video
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLoadVideo();
    }
  };

  if (isLoaded) {
    // Render the actual iframe once user clicks to play
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          onError={onError}
          title={`Video: ${title}`}
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={0}
          aria-label={`Video player for ${title}. ${hasCaptions ? 'Captions available.' : ''} Use keyboard controls: Space to play/pause, arrow keys to seek.`}
        />
      </div>
    );
  }

  // Render a lightweight facade/placeholder
  return (
    <div 
      className="relative w-full cursor-pointer group"
      style={{ paddingBottom: '56.25%' }}
      onClick={handleLoadVideo}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Load video: ${title}. Press Enter or Space to play.`}
    >
      {/* Thumbnail Background */}
      <div className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg overflow-hidden bg-gray-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Thumbnail for ${title}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          // Fallback gradient if no thumbnail
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <svg
              className="w-24 h-24 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200" />
      </div>

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-200 group-focus:ring-4 group-focus:ring-blue-500 group-focus:ring-offset-2">
          <svg
            className="w-10 h-10 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Platform Badge */}
      {platform === 'youtube' && (
        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold shadow-lg">
          YouTube
        </div>
      )}
      {platform === 'bunnystream' && (
        <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded text-sm font-semibold shadow-lg">
          Video
        </div>
      )}

      {/* Captions Badge */}
      {hasCaptions && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 text-gray-900 px-3 py-1 rounded text-xs font-medium shadow-lg flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          CC
        </div>
      )}

      {/* Click to Play Text */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Click to play
      </div>
    </div>
  );
}
