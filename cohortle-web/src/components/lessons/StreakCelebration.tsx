'use client';

/**
 * StreakCelebration
 * Shown briefly after a lesson is marked complete when the learner has an active streak.
 * Animates in from the bottom-right and auto-dismisses after 4 seconds.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Fire } from '@phosphor-icons/react';

interface StreakCelebrationProps {
  streakDays: number;
  isNewAchievement?: boolean;
  achievementTitle?: string;
  onDismiss: () => void;
}

export function StreakCelebration({
  streakDays,
  isNewAchievement,
  achievementTitle,
  onDismiss,
}: StreakCelebrationProps) {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const milestones = [3, 7, 14, 30, 60, 100];
  const isMilestone = milestones.includes(streakDays);

  const fireColour =
    streakDays >= 30 ? '#391D65' : streakDays >= 7 ? '#EA580C' : '#F97316';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={`${streakDays}-day streak`}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.9 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="fixed bottom-6 right-6 z-50 max-w-xs w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-start gap-3">
            {/* Fire icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${fireColour}18` }}
            >
              <Fire weight="fill" size={22} color={fireColour} aria-hidden="true" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {isMilestone
                  ? `🎉 ${streakDays}-day streak!`
                  : `${streakDays}-day streak`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {streakDays === 1
                  ? 'Great start — come back tomorrow to keep it going.'
                  : isMilestone
                  ? `You've hit a ${streakDays}-day milestone. Keep it up!`
                  : `You're on a roll. Come back tomorrow to reach ${streakDays + 1} days.`}
              </p>
              {isNewAchievement && achievementTitle && (
                <p className="text-xs font-medium text-[#391D65] mt-1">
                  🏆 New achievement: {achievementTitle}
                </p>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
