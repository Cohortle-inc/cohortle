'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import { markLessonComplete } from '@/lib/api/lessons';
import { SPRING_TRANSITION, REDUCED_MOTION_TRANSITION } from '@/lib/utils/animation';
import { trackLessonComplete } from '@/lib/utils/analytics';
import { ProgressRing } from './ProgressRing';
import { StreakCelebration } from './StreakCelebration';
import { getUserProfile } from '@/lib/api/profile';

interface CompletionButtonProps {
  lessonId: string;
  cohortId: string;
  isCompleted: boolean;
  onComplete?: () => void;
  previewMode?: boolean;
  progressPercentage?: number;
}

export function CompletionButton({
  lessonId,
  cohortId,
  isCompleted,
  onComplete,
  previewMode = false,
  progressPercentage = 0,
}: CompletionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<{ days: number } | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const transition = shouldReduceMotion ? REDUCED_MOTION_TRANSITION : SPRING_TRANSITION;

  const handleClick = async () => {
    if (previewMode || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await markLessonComplete(lessonId, cohortId);
      trackLessonComplete(lessonId, lessonId);
      setShowSuccess(true);
      onComplete?.();
      setTimeout(() => setShowSuccess(false), 2000);

      // Fetch updated streak to show celebration
      try {
        const profile = await getUserProfile();
        const streak = profile?.stats?.currentStreak ?? 0;
        if (streak > 0) {
          setStreakData({ days: streak });
        }
      } catch {
        // Non-critical — streak display is optional
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      const status = axiosErr?.response?.status;
      if (status === 401) {
        setError('You are not authorized to complete this lesson.');
      } else if (status === 404) {
        setError('This lesson could not be found.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Completed state
  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
        <CheckCircle weight="fill" size={20} aria-hidden="true" />
        <span>Completed</span>
      </div>
    );
  }

  // Success flash state
  if (showSuccess) {
    return (
      <div
        className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg"
        role="status"
        aria-live="polite"
      >
        <CheckCircle weight="fill" size={20} aria-hidden="true" />
        <span>Lesson Completed!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleClick}
        disabled={isLoading || previewMode}
        animate={shouldReduceMotion ? {} : { scale: isLoading ? 1 : 1 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
        transition={transition}
        className={
          previewMode
            ? 'flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gray-400 cursor-not-allowed opacity-70'
            : isLoading
            ? 'flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-blue-400 cursor-not-allowed'
            : 'flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors'
        }
      >
        {isLoading ? (
          <>
            <Circle weight="regular" size={20} aria-hidden="true" className="animate-spin" />
            <span>Marking as Complete…</span>
          </>
        ) : (
          <>
            <Circle weight="regular" size={20} aria-hidden="true" />
            <span>Mark as Complete</span>
          </>
        )}
      </motion.button>

      {previewMode && (
        <p className="text-xs text-gray-500">
          Completion actions are disabled in preview mode.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {progressPercentage > 0 && (
        <ProgressRing percentage={progressPercentage} size={32} strokeWidth={3} />
      )}

      {streakData && (
        <StreakCelebration
          streakDays={streakData.days}
          onDismiss={() => setStreakData(null)}
        />
      )}
    </div>
  );
}
