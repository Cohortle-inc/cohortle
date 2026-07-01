'use client';

import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useMarkLessonComplete } from '@/lib/hooks/useLessonCompletion';
import { isDriveUrl, getDriveEmbedUrl } from '@/lib/utils/driveUrlUtils';

interface LinkLessonContentProps {
  title: string;
  linkUrl: string;
  textContent?: string;
  lessonId?: string;
  cohortId?: string;
  isCompleted?: boolean;
}

export function LinkLessonContent({ 
  title, 
  linkUrl, 
  textContent,
  lessonId,
  cohortId,
  isCompleted = false
}: LinkLessonContentProps) {
  const [iframeError, setIframeError] = useState(false);

  // Sanitize text content if present
  const sanitizedText = textContent ? DOMPurify.sanitize(textContent) : '';
  
  // Hook for marking lesson complete
  const { mutate: markComplete } = useMarkLessonComplete();
  
  // Handle link click - track progress if not already completed
  const handleLinkClick = () => {
    if (lessonId && cohortId && !isCompleted) {
      markComplete({ lessonId, cohortId });
    }
  };

  // Determine Drive rendering mode
  const driveUrl = isDriveUrl(linkUrl);
  const embedUrl = driveUrl ? getDriveEmbedUrl(linkUrl) : null;
  // Show iframe when: it's a Drive URL, an embed URL exists, and the iframe hasn't errored
  const showEmbed = driveUrl && embedUrl !== null && !iframeError;
  // Show fallback-only when: Drive URL but no embed URL (e.g. video), or iframe errored
  const showDriveFallbackOnly = driveUrl && (embedUrl === null || iframeError);

  // "Open in Google Drive" fallback link element (reused in multiple places)
  const driveLink = (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleLinkClick}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      <span>Open in Google Drive</span>
      <svg
        className="w-4 h-4 ml-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );

  return (
    <div className="w-full">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>

      {/* Drive URL: embedded iframe with fallback link below (Req 8.3) */}
      {showEmbed && (
        <div className="mb-8">
          <iframe
            src={embedUrl!}
            className="w-full rounded-lg border border-gray-200"
            style={{ height: '600px' }}
            allowFullScreen
            onError={() => setIframeError(true)}
            title={title}
          />
          <div className="mt-3">
            {driveLink}
          </div>
        </div>
      )}

      {/* Drive URL: fallback only — video or iframe error (Req 8.4, 8.5) */}
      {showDriveFallbackOnly && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Google Drive File
              </h2>
              {driveLink}
            </div>
          </div>
        </div>
      )}

      {/* Non-Drive URL: existing external link card (Req 8.3 — unchanged behaviour) */}
      {!driveUrl && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            {/* External Link Icon */}
            <div className="flex-shrink-0 mr-4">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                External Resource
              </h2>
              
              {/* URL Display */}
              <p className="text-sm text-gray-600 mb-4 break-all">
                {linkUrl}
              </p>

              {/* Open Link Button */}
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <span>Open Link</span>
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>

              {/* External Link Indicator */}
              <p className="text-xs text-gray-500 mt-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                This link opens in a new tab
              </p>
            </div>
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
