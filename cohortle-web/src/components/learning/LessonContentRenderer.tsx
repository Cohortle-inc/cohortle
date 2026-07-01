'use client';

import { VideoLessonContent } from '@/components/lessons/VideoLessonContent';
import { TextLessonContent } from '@/components/lessons/TextLessonContent';
import { PdfLessonContent } from '@/components/lessons/PdfLessonContent';
import { LinkLessonContent } from '@/components/lessons/LinkLessonContent';
import { QuizLessonContent } from '@/components/lessons/QuizLessonContent';
import { LiveSessionContent } from '@/components/lessons/LiveSessionContent';
import { AssignmentLessonContent } from '@/components/lessons/AssignmentLessonContent';
import { QuizData, LiveSessionData } from '@/types/lesson';

interface LessonContentRendererProps {
  type: 'video' | 'text' | 'pdf' | 'link' | 'quiz' | 'live-session' | 'assignment';
  title: string;
  contentUrl?: string;
  contentText?: string;
  quizData?: QuizData;
  sessionData?: LiveSessionData;
  lessonId?: string;
  cohortId?: string;
  isCompleted?: boolean;
  onVideoEnd?: () => void;
  onQuizComplete?: (score: number) => void;
  // Video accessibility props
  captionUrl?: string;
  transcriptUrl?: string;
  hasCaptions?: boolean;
}

export function LessonContentRenderer({
  type,
  title,
  contentUrl,
  contentText,
  quizData,
  sessionData,
  lessonId,
  cohortId,
  isCompleted,
  onVideoEnd,
  onQuizComplete,
  captionUrl,
  transcriptUrl,
  hasCaptions
}: LessonContentRendererProps) {
  // Normalise type — DB stores 'live_session' but the type system uses 'live-session'
  const normalisedType = (type === 'live_session' as any ? 'live-session' : type) as LessonContentRendererProps['type'];
  // Route to appropriate content component based on lesson type
  switch (normalisedType) {
    case 'video':
      if (!contentUrl) {
        return <UnknownContentType type={type} message="Video URL is missing" />;
      }
      return (
        <VideoLessonContent
          title={title}
          videoUrl={contentUrl}
          textContent={contentText}
          captionUrl={captionUrl}
          transcriptUrl={transcriptUrl}
          hasCaptions={hasCaptions}
          onVideoEnd={onVideoEnd}
        />
      );

    case 'text':
      if (!contentText) {
        return <UnknownContentType type={type} message="Text content is missing" />;
      }
      return (
        <TextLessonContent
          title={title}
          htmlContent={contentText}
        />
      );

    case 'pdf':
      if (!contentUrl) {
        return <UnknownContentType type={type} message="PDF URL is missing" />;
      }
      return (
        <PdfLessonContent
          title={title}
          pdfUrl={contentUrl}
          textContent={contentText}
        />
      );

    case 'link':
      if (!contentUrl) {
        return <UnknownContentType type={type} message="Link URL is missing" />;
      }
      return (
        <LinkLessonContent
          title={title}
          linkUrl={contentUrl}
          textContent={contentText}
          lessonId={lessonId}
          cohortId={cohortId}
          isCompleted={isCompleted}
        />
      );

    case 'quiz':
      if (!quizData) {
        return <UnknownContentType type={type} message="Quiz data is missing" />;
      }
      return (
        <QuizLessonContent
          lessonId={lessonId ?? ''}
          cohortId={cohortId ? Number(cohortId) : 0}
          title={title}
          quizData={quizData}
          onQuizComplete={onQuizComplete}
        />
      );

    case 'live-session':
      if (!sessionData) {
        return (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
            <div
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center"
              role="alert"
              aria-live="polite"
            >
              <svg
                className="w-12 h-12 text-yellow-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Session details unavailable</h2>
              <p className="text-gray-600 text-sm">
                The session information could not be loaded. Please contact your instructor for the meeting link and schedule.
              </p>
            </div>
          </div>
        );
      }
      return (
        <LiveSessionContent
          title={title}
          sessionData={sessionData}
        />
      );

    case 'assignment':
      return (
        <AssignmentLessonContent
          lessonId={lessonId ?? ''}
          cohortId={cohortId ?? ''}
          title={title}
        />
      );

    default:
      return <UnknownContentType type={normalisedType} />;
  }
}
// Error component for unknown or unsupported content types
interface UnknownContentTypeProps {
  type: string;
  message?: string;
}

function UnknownContentType({ type, message }: UnknownContentTypeProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div 
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center"
        role="alert"
        aria-live="polite"
      >
        <svg
          className="w-16 h-16 text-yellow-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Content Unavailable
        </h2>
        <p className="text-gray-700 mb-1">
          {message || `This lesson type "${type}" is not supported or the content is missing.`}
        </p>
        <p className="text-sm text-gray-600">
          Please contact your instructor if you believe this is an error.
        </p>
      </div>
    </div>
  );
}
