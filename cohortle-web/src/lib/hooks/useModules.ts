/**
 * Module hooks using TanStack Query
 * Provides hooks for fetching module lessons
 */

import { useQuery } from '@tanstack/react-query';
import { getModuleLessons } from '../api/programmes';

/**
 * Hook to fetch lessons for a module
 * @param moduleId - ID of the module
 */
export function useModuleLessons(moduleId: string) {
  return useQuery({
    queryKey: ['modules', moduleId, 'lessons'],
    queryFn: () => getModuleLessons(moduleId),
    enabled: !!moduleId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
