'use client';

/**
 * PreviewMode Component
 * Allows conveners to preview their programme as learners would see it.
 * Enhancements:
 *  - "Preview as of date" picker: simulates week locking based on a chosen date
 *  - Progress simulation toggle: shows what the programme looks like with lessons completed
 *  - Inline lesson content modal: view lesson content without navigating away
 *  - Programme stats bar: summary of weeks / lessons / content types
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ProgrammeHeader } from '@/components/programmes/ProgrammeHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getWeeks, WeekWithLessons } from '@/lib/api/convener';
import { WLIMPWeek, WLIMPLesson } from '@/lib/api/programmes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewModeProps {
  programmeId: string;
  programmeName: string;
  programmeDescription?: string;
  onExit: () => void;
}

interface PreviewModeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

interface LessonModalProps {
  lesson: WLIMPLesson;
  weekTitle: string;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  pdf: 'PDF',
  link: 'Link',
  text: 'Text',
  quiz: 'Quiz',
  'live-session': 'Live Session',
};

function getContentTypeLabel(contentType: string): string {
  return CONTENT_TYPE_LABELS[contentType.toLowerCase()] ?? 'Lesson';
}

function getContentTypeIcon(contentType: string, className = 'w-5 h-5') {
  const type = contentType.toLowerCase();
  if (type === 'video') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    );
  }
  if (type === 'pdf') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type === 'quiz') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type === 'live-session') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
      </svg>
    );
  }
  if (type === 'text') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v1H7V5zm0 3h6v1H7V8zm0 3h4v1H7v-1z" clipRule="evenodd" />
      </svg>
    );
  }
  // link / default
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
    </svg>
  );
}

/** Determine if a week is locked given a simulated date and the week's start_date */
function isWeekLocked(week: WLIMPWeek, simulatedDate: Date | null): boolean {
  if (!simulatedDate || !week.start_date) return false;
  return new Date(week.start_date) > simulatedDate;
}

// ─── Inline Lesson Modal ──────────────────────────────────────────────────────

function LessonModal({ lesson, weekTitle, onClose }: LessonModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const label = getContentTypeLabel(lesson.content_type);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${lesson.title}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              {getContentTypeIcon(lesson.content_type)}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{weekTitle} · {label}</p>
              <h2 className="text-base font-semibold text-gray-900 truncate">{lesson.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="Close lesson preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {lesson.description && (
            <p className="text-sm text-gray-600">{lesson.description}</p>
          )}

          {/* Content preview based on type */}
          <LessonContentPreview lesson={lesson} />
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full font-medium">
            Preview only — completion disabled
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonContentPreview({ lesson }: { lesson: WLIMPLesson }) {
  const type = lesson.content_type.toLowerCase();

  if (type === 'video' && lesson.content_url) {
    return (
      <div className="rounded-lg overflow-hidden bg-black aspect-video">
        <iframe
          src={lesson.content_url}
          className="w-full h-full"
          allowFullScreen
          title={lesson.title}
        />
      </div>
    );
  }

  if (type === 'pdf' && lesson.content_url) {
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 400 }}>
        <iframe src={lesson.content_url} className="w-full h-full" title={lesson.title} />
      </div>
    );
  }

  if ((type === 'link') && lesson.content_url) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 flex items-center gap-3">
        {getContentTypeIcon('link', 'w-6 h-6 text-blue-500 flex-shrink-0')}
        <div className="min-w-0">
          <p className="text-sm text-gray-600 mb-1">External link</p>
          <a
            href={lesson.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm break-all"
          >
            {lesson.content_url}
          </a>
        </div>
      </div>
    );
  }

  if (type === 'quiz') {
    return (
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
        {getContentTypeIcon('quiz', 'w-10 h-10 text-purple-400 mx-auto mb-2')}
        <p className="text-sm text-purple-800 font-medium">Quiz lesson</p>
        <p className="text-xs text-purple-600 mt-1">Quiz interaction is disabled in preview mode.</p>
      </div>
    );
  }

  if (type === 'live-session') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
        {getContentTypeIcon('live-session', 'w-10 h-10 text-blue-400 mx-auto mb-2')}
        <p className="text-sm text-blue-800 font-medium">Live Session</p>
        <p className="text-xs text-blue-600 mt-1">Live session details will appear here for learners.</p>
      </div>
    );
  }

  // text / fallback
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-500 italic">
        {type === 'text'
          ? 'Text content will be rendered here for learners.'
          : `Content type "${lesson.content_type}" — no inline preview available.`}
      </p>
    </div>
  );
}

// ─── Enhanced Week Section ────────────────────────────────────────────────────

interface PreviewWeekSectionProps {
  week: WLIMPWeek;
  locked: boolean;
  simulateProgress: boolean;
  onLessonClick: (lesson: WLIMPLesson, weekTitle: string) => void;
}

function PreviewWeekSection({ week, locked, simulateProgress, onLessonClick }: PreviewWeekSectionProps) {
  const totalLessons = week.lessons.length;
  // In progress simulation, mark first half as completed
  const completedCount = simulateProgress ? Math.ceil(totalLessons / 2) : 0;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-opacity ${locked ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
      {/* Week header */}
      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {locked && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center" aria-label="Week locked">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Week {week.week_number}</h2>
              <p className="text-sm text-gray-600 mt-0.5">{week.title}</p>
              {week.start_date && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Starts {new Date(week.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {totalLessons > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{completedCount}/{totalLessons} completed</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
            {locked && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Locked
              </span>
            )}
            {week.isCurrent && !locked && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Current Week
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="p-4 sm:p-6">
        {locked ? (
          <div className="text-center py-6 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">This week is not yet available based on the selected date.</p>
          </div>
        ) : week.lessons.length === 0 ? (
          <p className="text-gray-500 text-center py-4 text-sm">No lessons available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...week.lessons]
              .sort((a, b) => a.order_index - b.order_index)
              .map((lesson, idx) => {
                const isCompleted = simulateProgress && idx < completedCount;
                return (
                  <PreviewLessonCard
                    key={lesson.id}
                    lesson={{ ...lesson, completed: isCompleted }}
                    weekTitle={`Week ${week.week_number}: ${week.title}`}
                    onPreview={onLessonClick}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Preview Lesson Card ──────────────────────────────────────────────────────

interface PreviewLessonCardProps {
  lesson: WLIMPLesson;
  weekTitle: string;
  onPreview: (lesson: WLIMPLesson, weekTitle: string) => void;
}

function PreviewLessonCard({ lesson, weekTitle, onPreview }: PreviewLessonCardProps) {
  const label = getContentTypeLabel(lesson.content_type);
  const isCompleted = lesson.completed || false;

  return (
    <button
      type="button"
      onClick={() => onPreview(lesson, weekTitle)}
      aria-label={`Preview ${lesson.title}, ${label}${isCompleted ? ', completed' : ''}`}
      className={`
        w-full text-left bg-white rounded-lg shadow-sm hover:shadow-md
        transition-shadow duration-200 p-4 cursor-pointer
        border ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-purple-300'}
        flex flex-col min-h-[120px]
      `}
    >
      <div className="flex items-start space-x-3 flex-1">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
            ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-600'}`}
          aria-hidden="true"
        >
          {getContentTypeIcon(lesson.content_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 flex-1">{lesson.title}</h3>
            {isCompleted && (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Completed">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {lesson.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{lesson.description}</p>
          )}
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className={`text-sm font-medium flex items-center gap-1 ${isCompleted ? 'text-green-700' : 'text-purple-600'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview content
        </span>
      </div>
    </button>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function ProgrammeStatsBar({ weeks }: { weeks: WLIMPWeek[] }) {
  const totalLessons = weeks.reduce((s, w) => s + w.lessons.length, 0);
  const typeCounts = weeks
    .flatMap(w => w.lessons)
    .reduce<Record<string, number>>((acc, l) => {
      const t = l.content_type.toLowerCase();
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});

  const stats = [
    { label: 'Weeks', value: weeks.length },
    { label: 'Lessons', value: totalLessons },
    ...Object.entries(typeCounts).map(([type, count]) => ({
      label: getContentTypeLabel(type),
      value: count,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-3 px-4 sm:px-6 py-3 bg-white border-b border-gray-200">
      {stats.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{value}</span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main PreviewMode Component ───────────────────────────────────────────────

export function PreviewMode({
  programmeId,
  programmeName,
  programmeDescription,
  onExit,
}: PreviewModeProps) {
  const [weeks, setWeeks] = useState<WLIMPWeek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhancement state
  const [simulatedDate, setSimulatedDate] = useState<string>(''); // ISO date string from input
  const [simulateProgress, setSimulateProgress] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: WLIMPLesson; weekTitle: string } | null>(null);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    async function fetchPreviewData() {
      try {
        setIsLoading(true);
        setError(null);
        const weeksData = await getWeeks(programmeId);
        const transformed: WLIMPWeek[] = weeksData.map((week) => ({
          id: week.id,
          programme_id: programmeId,
          week_number: week.weekNumber,
          title: week.title,
          start_date: week.startDate,
          isCurrent: false,
          lessons: week.lessons.map((lesson): WLIMPLesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            content_type: lesson.contentType,
            content_url: lesson.contentUrl,
            order_index: lesson.orderIndex,
            completed: false,
            completed_at: null,
          })),
        }));
        setWeeks(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPreviewData();
  }, [programmeId]);

  const handleLessonClick = useCallback((lesson: WLIMPLesson, weekTitle: string) => {
    setSelectedLesson({ lesson, weekTitle });
  }, []);

  const parsedSimulatedDate = simulatedDate ? new Date(simulatedDate) : null;

  const totalLessons = weeks.reduce((s, w) => s + w.lessons.length, 0);
  const overallProgress = { completed: 0, total: totalLessons, percentage: 0 };
  const programme = {
    id: programmeId,
    name: programmeName,
    description: programmeDescription || 'Preview of learner experience',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Preview Banner ── */}
      <div className="bg-yellow-50 border-b-2 border-yellow-400 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-900">Preview Mode</p>
                <p className="text-xs text-yellow-700">Viewing as a learner. Completion actions are disabled.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowControls(v => !v)}
                className="px-3 py-1.5 text-xs font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
                aria-expanded={showControls}
              >
                {showControls ? 'Hide controls' : 'Show controls'}
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Exit Preview
              </button>
            </div>
          </div>
        </div>

        {/* ── Preview Controls ── */}
        {showControls && (
          <div className="border-t border-yellow-200 bg-yellow-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-4">
              {/* Date picker */}
              <div className="flex items-center gap-2">
                <label htmlFor="preview-date" className="text-xs font-medium text-yellow-900 whitespace-nowrap">
                  Preview as of:
                </label>
                <input
                  id="preview-date"
                  type="date"
                  value={simulatedDate}
                  onChange={e => setSimulatedDate(e.target.value)}
                  className="text-xs border border-yellow-300 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {simulatedDate && (
                  <button
                    onClick={() => setSimulatedDate('')}
                    className="text-xs text-yellow-700 underline hover:text-yellow-900"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Progress simulation toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={simulateProgress}
                    onChange={e => setSimulateProgress(e.target.checked)}
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors ${simulateProgress ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${simulateProgress ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-xs font-medium text-yellow-900">Simulate progress</span>
              </label>

              {simulatedDate && (
                <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  Weeks locked before {new Date(simulatedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {simulateProgress && (
                <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  ~50% of lessons shown as completed
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* ── Error ── */}
      {error && !isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800 mb-1">Failed to load preview</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={onExit} className="mt-4 text-sm text-red-800 underline hover:text-red-900">Exit preview</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {!isLoading && !error && (
        <>
          <ProgrammeHeader programme={programme} progress={overallProgress} />

          {/* Stats bar */}
          {weeks.length > 0 && <ProgrammeStatsBar weeks={weeks} />}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {weeks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 text-sm mb-2">No weeks or lessons available yet</p>
                <p className="text-gray-500 text-xs">Create weeks and add lessons to see them in preview mode</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {weeks.map((week) => (
                  <PreviewWeekSection
                    key={week.id}
                    week={week}
                    locked={isWeekLocked(week, parsedSimulatedDate)}
                    simulateProgress={simulateProgress}
                    onLessonClick={handleLessonClick}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Lesson Modal ── */}
      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson.lesson}
          weekTitle={selectedLesson.weekTitle}
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </div>
  );
}

// ─── PreviewModeButton ────────────────────────────────────────────────────────

export function PreviewModeButton({ onClick, disabled = false }: PreviewModeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      Preview as Learner
    </button>
  );
}
