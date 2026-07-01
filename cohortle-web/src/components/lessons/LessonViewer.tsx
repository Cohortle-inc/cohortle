'use client';

import { useLessonData } from '@/lib/hooks/useLessonData';
import { useLessonCompletion, useMarkLessonComplete } from '@/lib/hooks/useLessonCompletion';
import { LessonContentRenderer } from '../learning/LessonContentRenderer';
import { CompletionButton } from './CompletionButton';
import { LessonNavigation } from './LessonNavigation';
import { LessonComments } from './LessonComments';
import { LessonOverview } from './LessonOverview';
import { MobileLessonOverview } from './MobileLessonOverview';
import { LessonBreadcrumb } from './LessonBreadcrumb';
import { useState, useEffect } from 'react';
import { usePerformanceMonitoring } from '@/lib/utils/performanceMonitoring';
import { LogoPulseInline } from '@/components/ui/LogoPulse';

interface LessonViewerProps {
  lessonId: string;
  cohortId: string;
  previewMode?: boolean;
}

export function LessonViewer({ lessonId, cohortId, previewMode = false }: LessonViewerProps) {
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLessonData(lessonId);
  const { data: completion, isLoading: completionLoading } = useLessonCompletion(lessonId, cohortId);
  const markCompleteMutation = useMarkLessonComplete();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileLessonOverviewOpen, setMobileLessonOverviewOpen] = useState(false);
  const [lessonStartTime] = useState(Date.now());
  const { trackCustomMetric, trackPageView } = usePerformanceMonitoring();

  // Track lesson performance metrics
  useEffect(() => {
    if (lesson && !lessonLoading) {
      const loadTime = Date.now() - lessonStartTime;
      trackCustomMetric('lesson_load_time', loadTime);
      trackPageView(`/lessons/${lessonId}`);
      
      // Track lesson type for analytics
      if (lesson.lesson_type) {
        trackCustomMetric('lesson_type_view', 1, lesson.lesson_type);
      }
    }
  }, [lesson, lessonLoading, lessonStartTime, lessonId, trackCustomMetric, trackPageView]);

  // Handle auto-completion when video ends
  const handleVideoEnd = async () => {
    // Don't auto-complete in preview mode
    if (previewMode) {
      return;
    }
    
    if (!completion?.completed) {
      try {
        await markCompleteMutation.mutateAsync({ lessonId, cohortId });
        trackCustomMetric('lesson_auto_completed', 1, 'video_end');
      } catch (error) {
        console.error('Failed to auto-complete lesson:', error);
      }
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (score: number) => {
    // Don't complete quiz in preview mode
    if (previewMode) {
      return;
    }
    
    if (!completion?.completed) {
      try {
        await markCompleteMutation.mutateAsync({ lessonId, cohortId });
      } catch (error) {
        console.error('Failed to complete quiz:', error);
      }
    }
  };

  // Handle manual completion
  const handleComplete = async () => {
    // Completion is handled by the CompletionButton component
    // This callback is just for any additional actions needed
  };

  // Loading state
  if (lessonLoading || completionLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LogoPulseInline message="Loading lesson…" />
        </div>
      </div>
    );
  }

  // Error state
  if (lessonError || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Failed to Load Lesson
          </h2>
          <p className="text-red-700 mb-4">
            {lessonError instanceof Error 
              ? lessonError.message 
              : 'Unable to load the lesson. Please try again later.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = completion?.completed || false;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 h-screen transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        {sidebarOpen && (
          <LessonOverview
            currentLessonId={lessonId}
            moduleId={lesson.module_id.toString()}
            cohortId={cohortId}
          />
        )}
      </aside>

      {/* Desktop Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden lg:block fixed left-0 top-4 z-10 bg-white border border-gray-300 rounded-r-lg p-2 shadow-sm hover:bg-gray-50 transition-all duration-300"
        style={{ left: sidebarOpen ? '256px' : '0px' }}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <svg
          className={`h-5 w-5 text-gray-600 transition-transform ${
            sidebarOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Mobile Lesson Overview FAB */}
      <button
        onClick={() => setMobileLessonOverviewOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center"
        aria-label="Open lesson overview"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Lesson Overview */}
      <MobileLessonOverview
        currentLessonId={lessonId}
        moduleId={lesson.module_id.toString()}
        cohortId={cohortId}
        isOpen={mobileLessonOverviewOpen}
        onClose={() => setMobileLessonOverviewOpen(false)}
      />

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb Navigation */}
          <LessonBreadcrumb
            lessonId={lessonId}
            lessonName={lesson.name}
            moduleId={lesson.module_id.toString()}
            cohortId={cohortId}
          />

          {/* Lesson Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <LessonContentRenderer
              type={lesson.lesson_type || 'text'}
              title={lesson.name}
              contentUrl={lesson.media}
              contentText={lesson.text}
              quizData={lesson.quiz_data}
              sessionData={lesson.live_session_data}
              lessonId={lessonId}
              cohortId={cohortId}
              isCompleted={isCompleted}
              onVideoEnd={handleVideoEnd}
              onQuizComplete={handleQuizComplete}
              captionUrl={lesson.caption_url}
              transcriptUrl={lesson.transcript_url}
              hasCaptions={lesson.has_captions}
            />
          </div>

          {/* Completion Button */}
          <div className="mb-6">
            <CompletionButton
              lessonId={lessonId}
              cohortId={cohortId}
              isCompleted={isCompleted}
              onComplete={handleComplete}
              previewMode={previewMode}
            />
          </div>

          {/* Navigation */}
          <div className="mb-6">
            <LessonNavigation
              currentLessonId={lessonId}
              moduleId={lesson.module_id.toString()}
              cohortId={cohortId}
              isCompleted={isCompleted}
            />
          </div>

          {/* Comments Section */}
          <LessonComments lessonId={lessonId} cohortId={cohortId} />
        </div>
      </main>
    </div>
  );
}
