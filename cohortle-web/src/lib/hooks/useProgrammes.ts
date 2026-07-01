/**
 * Programme/Community hooks using TanStack Query
 * Provides hooks for fetching community modules
 */

import { useQuery } from '@tanstack/react-query';
import { getCommunityModules } from '../api/programmes';

/**
 * Hook to fetch modules for a community
 * @param communityId - ID of the community
 */
export function useCommunityModules(communityId: string) {
  return useQuery({
    queryKey: ['communities', communityId, 'modules'],
    queryFn: () => getCommunityModules(communityId),
    enabled: !!communityId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
