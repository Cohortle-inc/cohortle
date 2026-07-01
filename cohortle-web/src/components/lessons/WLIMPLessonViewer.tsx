'use client';

/**
 * WLIMP Lesson Viewer Component
 * Displays WLIMP lesson content with embedded or linked external resources
 * 
 * Requirements:
 * - Display lesson title and description (4.1)
 * - Display or link to external content (4.2)
 * - Embed YouTube videos (4.3)
 * - Provide clickable links for PDF/Drive content (4.4)
 * - Provide back link to programme page (4.5)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLessonById, getEnrolledProgrammes, getLessonNavigation, LessonNavigation, WLIMPLessonDetail } from '@/lib/api/programmes';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CompletionButton } from './CompletionButton';
import { useLessonCompletion } from '@/lib/hooks/useLessonCompletion';
import { LogoPulseInline } from '@/components/ui/LogoPulse';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/utils/videoUrlHelpers';

interface WLIMPLessonViewerProps {
  lessonId: string;
}

export function WLIMPLessonViewer({ lessonId }: WLIMPLessonViewerProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [lesson, setLesson] = useState<WLIMPLessonDetail | null>(null);
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<LessonNavigation | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  
  // Fetch completion status once we have both lessonId and cohortId
  const { data: completionData } = useLessonCompletion(
    lessonId || '',
    cohortId || ''
  );

  useEffect(() => {
    async function fetchLesson() {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // Check authentication
      if (!isAuthenticated) {
        router.push(`/login?returnUrl=/lessons/${lessonId}`);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch lesson data
        const lessonData = await getLessonById(lessonId);
        
        // Get enrolled programmes to find the cohort_id
        const enrolledProgrammes = await getEnrolledProgrammes();
        const enrolledProgramme = enrolledProgrammes.find(
          p => p.id === lessonData.programme_id
        );
        
        if (!enrolledProgramme) {
          // Redirect to join page if not enrolled
          router.push('/join');
          return;
        }

        if (lessonData.week_start_date) {
          const weekStartDate = new Date(lessonData.week_start_date);
          weekStartDate.setHours(0, 0, 0, 0);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (weekStartDate > today) {
            setError(`This lesson is locked until ${weekStartDate.toLocaleDateString()}.`);
            return;
          }
        }
        
        setLesson(lessonData);
        setCohortId(enrolledProgramme.cohortId.toString());
        
        // Fetch navigation (prev/next lesson IDs)
        try {
          const nav = await getLessonNavigation(lessonId, enrolledProgramme.cohortId.toString());
          setNavigation(nav);
        } catch {
          // Non-critical — navigation is optional
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId, router, isAuthenticated, authLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LogoPulseInline message="Loading lesson…" />
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Failed to Load Lesson
            </h2>
            <p className="text-red-700 mb-4">
              {error || 'Unable to load the lesson. Please try again later.'}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Link */}
        <div className="mb-4 sm:mb-6">
          <Link
            href={`/programmes/${lesson.programme_id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium min-h-[44px] py-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="truncate max-w-[250px] sm:max-w-none">
              Back to {lesson.programme_name}
            </span>
          </Link>
        </div>

        {/* Lesson Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium rounded-full mb-3">
              Week {lesson.week_number} • {lesson.week_title}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                {lesson.description}
              </p>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {renderContent(lesson)}
        </div>

        {/* Completion Button */}
        {cohortId && (
          <div className="mt-6">
            <CompletionButton
              lessonId={lessonId}
              cohortId={cohortId}
              isCompleted={completionData?.completed || false}
              onComplete={() => setJustCompleted(true)}
            />
          </div>
        )}

        {/* Post-completion navigation */}
        {(justCompleted || completionData?.completed) && navigation && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {navigation.hasNext && navigation.nextLessonId ? (
              <Link
                href={`/lessons/${navigation.nextLessonId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: '#391D65' }}
              >
                Next Step
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <Link
                href={`/programmes/${lesson.programme_id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: '#391D65' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Week Complete — Back to Programme
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for video content
 */
function VideoLoadingSkeleton() {
  return (
    <div className="relative w-full bg-gray-200 animate-pulse" style={{ paddingBottom: '56.25%' }}>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Loading video...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * YouTube video embed with loading state
 */
function YouTubeEmbed({ videoUrl, title }: { videoUrl: string; title: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full">
          <VideoLoadingSkeleton />
        </div>
      )}
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIsLoading(false)}
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
      />
    </div>
  );
}

/**
 * Render content based on content type
 */
function renderContent(lesson: WLIMPLessonDetail) {
  const contentType = lesson.content_type.toLowerCase();

  // YouTube video embed (Requirement 4.3)
  if (contentType === 'video' && isYouTubeUrl(lesson.content_url)) {
    return <YouTubeEmbed videoUrl={lesson.content_url} title={lesson.title} />;
  }

  // PDF or Drive link (Requirement 4.4)
  return (
    <div className="p-6 sm:p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        {getContentIcon(contentType)}
      </div>
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
        {getContentTypeLabel(contentType)} Content
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">
        Click the button below to access the lesson content
      </p>
      <a
        href={lesson.content_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-3 min-h-[44px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-base"
      >
        Open {getContentTypeLabel(contentType)}
        <svg
          className="w-5 h-5 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

/**
 * Get content type label
 */
function getContentTypeLabel(contentType: string): string {
  const type = contentType.toLowerCase();
  if (type === 'video') return 'Video';
  if (type === 'pdf') return 'PDF';
  return 'Link';
}

/**
 * Get content type icon
 */
function getContentIcon(contentType: string) {
  const type = contentType.toLowerCase();

  if (type === 'video') {
    return (
      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    );
  }

  if (type === 'pdf') {
    return (
      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
        clipRule="evenodd"
      />
    </svg>
  );
}
