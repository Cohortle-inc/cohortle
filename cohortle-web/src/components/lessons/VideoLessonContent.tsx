'use client';

import { useState, useEffect, useRef } from 'react';
import { isYouTubeUrl, isBunnyStreamUrl, getYouTubeEmbedUrl, getBunnyStreamEmbedUrl } from '@/lib/utils/videoUrlHelpers';
import { LazyVideoEmbed } from './LazyVideoEmbed';
import DOMPurify from 'dompurify';

interface VideoLessonContentProps {
  title: string;
  videoUrl: string;
  textContent?: string;
  captionUrl?: string;
  transcriptUrl?: string;
  hasCaptions?: boolean;
  onVideoEnd?: () => void;
}

export function VideoLessonContent({ 
  title, 
  videoUrl, 
  textContent,
  captionUrl,
  transcriptUrl,
  hasCaptions = false,
  onVideoEnd 
}: VideoLessonContentProps) {
  const [videoError, setVideoError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [platform, setPlatform] = useState<'youtube' | 'bunnystream' | 'unknown'>('unknown');
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoEndedRef = useRef(false);

  useEffect(() => {
    // Detect video platform and prepare embed URL
    if (isYouTubeUrl(videoUrl)) {
      setPlatform('youtube');
      setEmbedUrl(getYouTubeEmbedUrl(videoUrl));
    } else if (isBunnyStreamUrl(videoUrl)) {
      setPlatform('bunnystream');
      setEmbedUrl(getBunnyStreamEmbedUrl(videoUrl));
    } else {
      setPlatform('unknown');
      setEmbedUrl(videoUrl);
    }
  }, [videoUrl]);

  useEffect(() => {
    // Listen for video end events via postMessage API
    if (onVideoEnd) {
      const handleMessage = (event: MessageEvent) => {
        // Prevent duplicate calls
        if (videoEndedRef.current) return;

        try {
          // YouTube iframe API sends messages with event data
          if (platform === 'youtube' && event.data && typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            // YouTube sends event: 0 when video ends (YT.PlayerState.ENDED)
            if (data.event === 'onStateChange' && data.info === 0) {
              videoEndedRef.current = true;
              onVideoEnd();
            }
          }
          
          // BunnyStream sends ended event
          if (platform === 'bunnystream' && event.data) {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data.event === 'ended' || data.type === 'ended') {
              videoEndedRef.current = true;
              onVideoEnd();
            }
          }
        } catch (error) {
          // Ignore parsing errors from other postMessage sources
          console.debug('Video message parsing error:', error);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
        videoEndedRef.current = false;
      };
    }
  }, [platform, onVideoEnd]);

  const handleIframeError = () => {
    setVideoError(true);
  };

  const handleRetry = () => {
    setVideoError(false);
    setRetryCount(prev => prev + 1);
  };

  // Sanitize text content if present
  const sanitizedText = textContent ? DOMPurify.sanitize(textContent) : '';

  // Add platform-specific parameters for video tracking
  const finalEmbedUrl = (() => {
    if (!embedUrl) return '';
    
    if (platform === 'youtube') {
      // Add enablejsapi for postMessage events and origin for security
      const separator = embedUrl.includes('?') ? '&' : '?';
      return `${embedUrl}${separator}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
    }
    
    if (platform === 'bunnystream') {
      // BunnyStream URLs are already embed-ready, just ensure they're valid
      return embedUrl;
    }
    
    return embedUrl;
  })();

  return (
    <div className="w-full" data-testid="video-lesson">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>

      {/* Video Player */}
      <div className="mb-8">
        {videoError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-800 font-medium mb-2">Video unavailable</p>
            <p className="text-red-600 text-sm mb-4">
              The video could not be loaded. This may be due to network issues or the video being unavailable.
            </p>
            {retryCount < 3 && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            )}
            {platform !== 'unknown' && (
              <div className="mt-4">
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-800 underline text-sm"
                >
                  Open video in new tab
                </a>
              </div>
            )}
          </div>
        ) : (
          <LazyVideoEmbed
            embedUrl={finalEmbedUrl}
            title={title}
            platform={platform}
            hasCaptions={hasCaptions}
            onError={handleIframeError}
          />
        )}
      </div>

      {/* Platform indicator for debugging/testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 text-xs text-gray-500">
          Platform: {platform} | Retry count: {retryCount}
        </div>
      )}

      {/* Video Accessibility Features */}
      {(hasCaptions || captionUrl || transcriptUrl) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Accessibility Options
          </h2>
          <div className="space-y-2">
            {hasCaptions && (
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Captions Available</p>
                  <p className="text-xs text-gray-600">
                    Enable captions using the video player controls (CC button)
                  </p>
                </div>
              </div>
            )}
            {captionUrl && (
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5"
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
                <div>
                  <p className="text-sm font-medium text-gray-900">Caption File</p>
                  <a
                    href={captionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                    download
                  >
                    Download caption file
                  </a>
                </div>
              </div>
            )}
            {transcriptUrl && (
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Video Transcript</p>
                  <a
                    href={transcriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View full transcript
                  </a>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-600">
              <strong>Keyboard controls:</strong> Use Space to play/pause, Arrow keys to seek, 
              M to mute, F for fullscreen, and C to toggle captions.
            </p>
          </div>
        </div>
      )}

      {/* Text Content (if present) */}
      {textContent && (
        <div 
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: sanitizedText }}
        />
      )}
    </div>
  );
}
