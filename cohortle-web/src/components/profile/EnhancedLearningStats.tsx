'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  GraduationCap,
  Lightning,
  Trophy,
} from '@phosphor-icons/react';

interface LearningStatsProps {
  totalProgrammes: number;
  completedProgrammes: number;
  totalLessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function LearningStatsComponent({
  totalProgrammes,
  completedProgrammes,
  totalLessonsCompleted,
  currentStreak,
  longestStreak,
  isLoading = false,
  error = null,
  onRetry
}: LearningStatsProps) {
  const stats = useMemo(() => [
    {
      label: 'Programmes Enrolled',
      value: totalProgrammes,
      icon: <BookOpen size={28} weight="duotone" />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Programmes Completed',
      value: completedProgrammes,
      icon: <CheckCircle size={28} weight="duotone" />,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Lessons Completed',
      value: totalLessonsCompleted,
      icon: <GraduationCap size={28} weight="duotone" />,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: <Lightning size={28} weight="duotone" />,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Longest Streak',
      value: `${longestStreak} days`,
      icon: <Trophy size={28} weight="duotone" />,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ], [totalProgrammes, completedProgrammes, totalLessonsCompleted, currentStreak, longestStreak]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Learning Statistics</h2>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-4 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Unable to load statistics</h3>
          <p className="text-xs text-gray-600 mb-4">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#391D65] rounded hover:bg-[#391D65]/90 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Learning Statistics</h2>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Refresh statistics"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className={`${stat.color} rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3 transition-all hover:shadow-md`}
          >
            <span className="flex-shrink-0" aria-hidden="true">
              {stat.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress insights */}
      {totalProgrammes > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Completion Rate</span>
            <span className="font-semibold text-gray-900">
              {Math.round((completedProgrammes / totalProgrammes) * 100)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((completedProgrammes / totalProgrammes) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(LearningStatsComponent);