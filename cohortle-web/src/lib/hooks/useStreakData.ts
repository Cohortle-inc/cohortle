'use client';

import { useState, useEffect } from 'react';
import { getUserProfile } from '@/lib/api/profile';

/**
 * Lightweight hook that fetches the current user's streak from the profile API.
 * Returns { currentStreak, isLoading } with a fallback of 0 while loading.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function useStreakData(): { currentStreak: number; isLoading: boolean } {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStreak() {
      try {
        const profile = await getUserProfile();
        if (!cancelled) {
          setCurrentStreak(profile?.stats?.currentStreak ?? 0);
        }
      } catch {
        // Silently fall back to 0 — streak display is non-critical
        if (!cancelled) {
          setCurrentStreak(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchStreak();
    return () => { cancelled = true; };
  }, []);

  return { currentStreak, isLoading };
}
