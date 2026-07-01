'use client';

import { formatDistanceToNow } from 'date-fns';
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
}

export default function AchievementsBadges({ achievements }: AchievementsBadgesProps) {
  const shouldReduceMotion = useReducedMotion();

  const badgeTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 20 };

  if (achievements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
        <p className="text-gray-500 text-center py-8">
          No achievements earned yet. Keep learning to unlock badges!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={badgeTransition}
              className="border border-gray-200 rounded-lg p-4 text-center hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-center mb-2">
                <AchievementBadgeIcon
                  category={achievement.category}
                  rarity={achievement.rarity}
                  size={40}
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{achievement.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
              <p className="text-xs text-gray-500">
                Earned {formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true })}
              </p>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
