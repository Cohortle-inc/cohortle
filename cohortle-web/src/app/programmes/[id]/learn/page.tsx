'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import ProgrammeStructureView, {
  ProgrammeWithWeeks,
  WeekWithLessons,
  LessonSummary,
} from '@/components/learning/ProgrammeStructureView';
import { getProgrammeWeeks, getEnrolledProgrammes } from '@/lib/api/programmes';
import { getAssignmentStatuses } from '@/lib/api/assignments';

/**
 * Programme Learning Page
 * 
 * Displays programme structure with weeks and lessons.
 * Requires authentication and enrollment verification.
 * Provides tab navigation between Content and Community.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.11, 3.12, 3.13
 */
export default function ProgrammeLearnPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [programme, setProgramme] = useState<ProgrammeWithWeeks | null>(null);
  const [cohortId, setCohortId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'community'>('content');

  const programmeId = params?.id as string;

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/programmes/${programmeId}/learn`);
      return;
    }

    const fetchProgrammeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check enrollment
        const enrolledProgrammes = await getEnrolledProgrammes();
        const enrollment = enrolledProgrammes.find(
          (p) => p.id.toString() === programmeId
        );

        if (!enrollment) {
          setError('You are not enrolled in this programme');
          setIsLoading(false);
          return;
        }

        setCohortId(enrollment.cohortId);

        // Fetch programme weeks with lessons
        const weeks = await getProgrammeWeeks(programmeId, enrollment.cohortId.toString());

        // Fetch assignment submission statuses for this cohort (best-effort, don't fail if unavailable)
        let assignmentStatuses: Record<string, 'submitted' | 'passed' | 'needs_revision'> = {};
        try {
          assignmentStatuses = await getAssignmentStatuses(enrollment.cohortId);
        } catch {
          // Non-fatal — badges just won't show
        }

        // Transform to ProgrammeWithWeeks format
        const transformedWeeks: WeekWithLessons[] = weeks.map((week) => ({
          id: week.id,
          weekNumber: week.week_number,
          title: week.title,
          description: '',
          startDate: week.start_date,
          isLocked: new Date(week.start_date) > new Date(),
          progress: week.lessons.length > 0
            ? (week.lessons.filter((l) => l.completed).length / week.lessons.length) * 100
            : 0,
          lessons: week.lessons.map((lesson): LessonSummary => ({
            id: lesson.id,
            title: lesson.title,
            type: lesson.content_type as LessonSummary['type'],
            duration: undefined,
            isCompleted: lesson.completed || false,
            orderIndex: lesson.order_index,
            assignmentStatus: lesson.content_type === 'assignment'
              ? (assignmentStatuses[lesson.id] ?? 'not_started')
              : undefined,
          })),
        }));

        const totalLessons = transformedWeeks.reduce((sum, w) => sum + w.lessons.length, 0);
        const completedLessons = transformedWeeks.reduce(
          (sum, w) => sum + w.lessons.filter((l) => l.isCompleted).length,
          0
        );

        const programmeData: ProgrammeWithWeeks = {
          id: enrollment.id,
          name: enrollment.name,
          description: enrollment.description,
          progress: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
          weeks: transformedWeeks,
        };

        setProgramme(programmeData);
      } catch (err) {
        console.error('Failed to fetch programme data:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load programme. Please try again later.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgrammeData();
  }, [programmeId, user, router]);

  const handleLessonClick = (lessonId: string) => {
    router.push(`/lessons/${lessonId}`);
  };

  const handleTabChange = (tab: 'content' | 'community') => {
    if (tab === 'community') {
      router.push(`/programmes/${programmeId}/community`);
    } else {
      setActiveTab(tab);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-6" />
            <div className="h-6 bg-gray-200 rounded w-full" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !programme) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-6"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Unable to Load Programme
                </h3>
                <p className="text-red-800 mb-4">
                  {error || 'Programme not found'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Try Again
                  </button>
                  <a
                    href="/dashboard"
                    className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <nav className="mb-6" aria-label="Programme sections">
          <div className="border-b border-gray-200">
            <div className="-mb-px flex space-x-8" role="tablist">
              <button
                onClick={() => handleTabChange('content')}
                className={`${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                role="tab"
                aria-selected={activeTab === 'content'}
                aria-controls="content-panel"
              >
                Content
              </button>
              <button
                onClick={() => handleTabChange('community')}
                className={`${
                  activeTab === 'community'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                role="tab"
                aria-selected={activeTab === 'community'}
                aria-controls="community-panel"
              >
                Community
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main role="main">
          {activeTab === 'content' && (
            <div id="content-panel" role="tabpanel" aria-labelledby="content-tab">
              <ProgrammeStructureView
                programme={programme}
                cohortId={cohortId!}
                onLessonClick={handleLessonClick}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
