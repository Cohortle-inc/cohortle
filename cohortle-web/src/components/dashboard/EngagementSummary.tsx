'use client';

/**
 * EngagementSummary
 * Shows the learner's current streak, longest streak, and earned achievements
 * on the dashboard. Fetches from the profile API.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Fire, Trophy, Star } from '@phosphor-icons/react';
import { getUserProfile, getUserAchievements, getLearningGoal, type LearningGoal } from '@/lib/api/profile';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalLessonsCompleted: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

const RARITY_COLOURS: Record<string, string> = {
  common: 'bg-gray-100 text-gray-600 border-gray-200',
  rare: 'bg-blue-50 text-blue-700 border-blue-200',
  epic: 'bg-purple-50 text-purple-700 border-purple-200',
  legendary: 'bg-amber-50 text-amber-700 border-amber-200',
};

function StreakPip({ active }: { active: boolean }) {
  return (
    <div
      className={`w-2 h-2 rounded-full ${active ? 'bg-orange-400' : 'bg-gray-200'}`}
      aria-hidden="true"
    />
  );
}

export function EngagementSummary() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getUserProfile(), getUserAchievements(), getLearningGoal().catch(() => null)])
      .then(([profile, ach, g]) => {
        if (cancelled) return;
        setStats(profile?.stats ?? null);
        setAchievements(ach ?? []);
        setGoal(g);
      })
      .catch(() => {
        // Non-critical — silently fail
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 min-h-[280px] animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="flex gap-3 mb-5">
          <div className="h-16 bg-gray-100 rounded-lg flex-1" />
          <div className="h-16 bg-gray-100 rounded-lg flex-1" />
          <div className="h-16 bg-gray-100 rounded-lg flex-1" />
        </div>
        <div className="h-2 bg-gray-100 rounded w-full mb-4" />
        <div className="space-y-2">
          <div className="h-8 bg-gray-100 rounded-lg" />
          <div className="h-8 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!stats) {
    // Reserve space so the sidebar doesn't collapse and cause CLS
    return <div className="bg-white rounded-xl border border-gray-200 p-5 min-h-[280px]" />;
  }

  const { currentStreak, longestStreak, totalLessonsCompleted } = stats;
  const recentAchievements = achievements.slice(0, 3);

  // Build a 7-pip streak visualisation (last 7 days indicator)
  const pipCount = Math.min(currentStreak, 7);

  const fireColour =
    currentStreak >= 30 ? '#391D65' : currentStreak >= 7 ? '#EA580C' : '#F97316';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Your Progress</h2>
        <Link
          href="/profile"
          className="text-xs text-[#391D65] hover:underline font-medium"
        >
          View profile →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Current streak */}
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <Fire weight="fill" size={20} color={fireColour} className="mx-auto mb-1" aria-hidden="true" />
          <p className="text-xl font-bold text-gray-900">{currentStreak}</p>
          <p className="text-xs text-gray-500">day streak</p>
        </div>

        {/* Longest streak */}
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <Trophy weight="duotone" size={20} color="#CA8A04" className="mx-auto mb-1" aria-hidden="true" />
          <p className="text-xl font-bold text-gray-900">{longestStreak}</p>
          <p className="text-xs text-gray-500">best streak</p>
        </div>

        {/* Lessons completed */}
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <Star weight="duotone" size={20} color="#7C3AED" className="mx-auto mb-1" aria-hidden="true" />
          <p className="text-xl font-bold text-gray-900">{totalLessonsCompleted}</p>
          <p className="text-xs text-gray-500">lessons done</p>
        </div>
      </div>

      {/* 7-day streak pips */}
      {currentStreak > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-2">
            {currentStreak >= 7
              ? '7-day streak active'
              : `${7 - currentStreak} more day${7 - currentStreak !== 1 ? 's' : ''} to reach a week`}
          </p>
          <div className="flex gap-1.5" aria-label={`${currentStreak} of 7 days active`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <StreakPip key={i} active={i < pipCount} />
            ))}
          </div>
        </div>
      )}

      {/* Weekly goal progress */}
      {goal && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-gray-500">
              Weekly goal — {goal.target}{' '}
              {goal.type === 'lessons_per_week' ? 'lessons' : 'hrs'}
            </p>
            <p className="text-xs font-semibold text-gray-700">
              {goal.current}/{goal.target}
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                goal.current >= goal.target ? 'bg-green-500' : 'bg-[#391D65]'
              }`}
              style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
            />
          </div>
          {goal.current >= goal.target && (
            <p className="text-xs text-green-600 font-medium mt-1">Goal reached this week 🎉</p>
          )}
          {goal.current < goal.target && goal.current > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {goal.type === 'lessons_per_week'
                ? `${goal.target - goal.current} more lesson${goal.target - goal.current !== 1 ? 's' : ''} to go`
                : `${Math.round((goal.target - goal.current) * 10) / 10} more hrs to go`}
            </p>
          )}
        </div>
      )}

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Recent achievements</p>
          <div className="space-y-2">
            {recentAchievements.map(a => (
              <div
                key={a.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                  RARITY_COLOURS[a.rarity ?? 'common']
                }`}
              >
                <span className="text-base" aria-hidden="true">{a.icon || '🏅'}</span>
                <span className="font-medium truncate">{a.title}</span>
              </div>
            ))}
          </div>
          {achievements.length > 3 && (
            <Link
              href="/profile"
              className="block text-center text-xs text-[#391D65] hover:underline mt-2"
            >
              +{achievements.length - 3} more achievements
            </Link>
          )}
        </div>
      )}

      {/* No achievements yet */}
      {achievements.length === 0 && totalLessonsCompleted === 0 && (
        <p className="text-xs text-gray-400 text-center">
          Complete your first lesson to start earning achievements.
        </p>
      )}
    </div>
  );
}
