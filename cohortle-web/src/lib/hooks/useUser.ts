/**
 * User data hooks using TanStack Query
 * Provides hooks for fetching user profile and communities
 */

import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getUserCommunities } from '../api/user';

/**
 * Hook to fetch user profile
 * Caches data for 5 minutes
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user's enrolled communities
 * Caches data for 2 minutes
 */
export function useUserCommunities() {
  return useQuery({
    queryKey: ['user', 'communities'],
    queryFn: getUserCommunities,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
