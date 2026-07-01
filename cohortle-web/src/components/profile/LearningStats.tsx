'use client';

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
}

export default function LearningStats({
  totalProgrammes,
  completedProgrammes,
  totalLessonsCompleted,
  currentStreak,
  longestStreak,
}: LearningStatsProps) {
  const stats = [
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
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Learning Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.color} rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3`}
          >
            <span className="flex-shrink-0" aria-hidden="true">
              {stat.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
