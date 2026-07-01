'use client';

import { formatDistanceToNow } from 'date-fns';
import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AchievementBadgeIcon from './AchievementBadgeIcon';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

interface AchievementsBadgesProps {
  achievements: Achievement[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function AchievementsBadgesComponent({ 
  achievements, 
  isLoading = false, 
  error = null, 
  onRetry 
}: AchievementsBadgesProps) {
  const [filter, setFilter] = useState<string>('all');
  const shouldReduceMotion = useReducedMotion();

  const badgeTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 20 };

  const { filteredAchievements, categories } = useMemo(() => {
    const uniqueCategories = Array.from(new Set(achievements.map(a => a.category).filter((cat): cat is string => Boolean(cat))));
    const cats = ['all', ...uniqueCategories];
    const filtered = filter === 'all' 
      ? achievements 
      : achievements.filter(a => a.category === filter);
    
    return {
      filteredAchievements: filtered.sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()),
      categories: cats
    };
  }, [achievements, filter]);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50';
      case 'epic':
        return 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50';
      case 'rare':
        return 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50';
      case 'common':
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getRarityBadge = (rarity?: string) => {
    if (!rarity || rarity === 'common') return null;
    
    const colors = {
      legendary: 'bg-yellow-100 text-yellow-800',
      epic: 'bg-purple-100 text-purple-800',
      rare: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[rarity as keyof typeof colors]}`}>
        {rarity}
      </span>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
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
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Achievements</h2>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-4 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Unable to load achievements</h3>
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

  // Empty state
  if (achievements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Achievements</h2>
        <div className="text-center py-6 sm:py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No achievements yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Keep learning to unlock badges and achievements!
          </p>
          <div className="text-xs text-gray-400">
            Complete lessons, finish programmes, and engage with the community to earn your first achievement.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Achievements ({achievements.length})
        </h2>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Refresh achievements"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === category
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={badgeTransition}
            className={`border-2 rounded-lg p-4 text-center hover:shadow-md transition-all ${getRarityColor(achievement.rarity)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <AchievementBadgeIcon
                category={achievement.category}
                rarity={achievement.rarity}
                size={40}
              />
              {getRarityBadge(achievement.rarity)}
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
              {achievement.title}
            </h3>
            
            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
              {achievement.description}
            </p>
            
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true })}
            </div>
            
            {achievement.category && (
              <div className="mt-2">
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {achievement.category}
                </span>
              </div>
            )}
          </motion.div>
        ))}
        </div>
      </AnimatePresence>

      {/* Achievement summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {achievements.length}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {achievements.filter(a => a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary').length}
            </div>
            <div className="text-xs text-gray-600">Rare+</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {new Set(achievements.map(a => a.category).filter(Boolean)).size}
            </div>
            <div className="text-xs text-gray-600">Categories</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {achievements.filter(a => {
                const earnedDate = new Date(a.earnedAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return earnedDate > thirtyDaysAgo;
              }).length}
            </div>
            <div className="text-xs text-gray-600">Recent</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AchievementsBadgesComponent);