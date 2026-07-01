'use client';

/**
 * Programme Detail Page
 * Displays programme structure organized by weeks with lessons
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LogoPulse } from '@/components/ui/LogoPulse';
import { getProgrammeWeeks, isEnrolledInProgramme, getEnrolledProgrammes, WLIMPWeek } from '@/lib/api/programmes';
import { useAuth } from '@/lib/contexts/AuthContext';

// Dynamic imports for programme components to reduce initial bundle
const ProgrammeHeader = dynamicImport(
  () => import('@/components/programmes/ProgrammeHeader').then(mod => ({ default: mod.ProgrammeHeader })),
  { ssr: true }
);

const WeekSection = dynamicImport(
  () => import('@/components/programmes/WeekSection').then(mod => ({ default: mod.WeekSection })),
  { ssr: true }
);

interface ProgrammePageProps {
  params: {
    id: string;
  };
}

export default function ProgrammePage({ params }: ProgrammePageProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [weeks, setWeeks] = useState<WLIMPWeek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programme, setProgramme] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [cohortId, setCohortId] = useState<number | null>(null);
  const [overallProgress, setOverallProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
  }>({ completed: 0, total: 0, percentage: 0 });
  const [nextIncompleteLesson, setNextIncompleteLesson] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    async function fetchProgrammeData() {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // Check authentication
      if (!isAuthenticated) {
        router.push(`/login?returnUrl=/programmes/${params.id}`);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if user is enrolled in this programme
        const enrolled = await isEnrolledInProgramme(params.id);
        
        if (!enrolled) {
          // Redirect to join page if not enrolled
          router.push('/join');
          return;
        }

        // Get enrolled programmes to find cohort_id
        const enrolledProgrammes = await getEnrolledProgrammes();
        const currentProgramme = enrolledProgrammes.find(p => p.id.toString() === params.id);
        
        if (!currentProgramme) {
          throw new Error('Programme not found in enrolled programmes');
        }

        setCohortId(currentProgramme.cohortId);

        // Fetch weeks with lessons and completion status
        const weeksData = await getProgrammeWeeks(params.id, currentProgramme.cohortId.toString());
        setWeeks(weeksData);

        // Calculate overall progress
        const totalLessons = weeksData.reduce((sum, week) => sum + week.lessons.length, 0);
        const completedLessons = weeksData.reduce(
          (sum, week) => sum + week.lessons.filter(lesson => lesson.completed).length,
          0
        );
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        setOverallProgress({
          completed: completedLessons,
          total: totalLessons,
          percentage: progressPercentage,
        });

        // Find next incomplete lesson
        let nextLesson: { id: string; title: string } | null = null;
        for (const week of weeksData) {
          const incompleteLesson = week.lessons
            .sort((a, b) => a.order_index - b.order_index)
            .find(lesson => !lesson.completed);
          if (incompleteLesson) {
            nextLesson = {
              id: incompleteLesson.id,
              title: incompleteLesson.title,
            };
            break;
          }
        }
        setNextIncompleteLesson(nextLesson);

        // Set programme info from enrolled programme data
        setProgramme({
          id: params.id,
          name: currentProgramme.name,
          description: currentProgramme.description || 'Access your weekly lessons and learning materials',
        });
      } catch (err) {
        console.error('Error fetching programme data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load programme');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgrammeData();
  }, [params.id, router, isAuthenticated, authLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LogoPulse message="Loading programme…" />
      </div>
    );
  }

  // Error state
  if (error || !programme) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4 text-sm sm:text-base">{error || 'Failed to load programme'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Programme Header */}
      <ProgrammeHeader 
        programme={programme} 
        progress={overallProgress}
        nextIncompleteLesson={nextIncompleteLesson}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {weeks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-sm sm:text-base">No weeks available yet</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {weeks.map((week) => (
              <WeekSection key={week.id} week={week} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
