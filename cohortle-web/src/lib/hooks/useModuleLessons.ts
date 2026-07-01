/**
 * React Query hook for fetching module lessons
 */

import { useQuery } from '@tanstack/react-query';
import { fetchModuleLessons } from '../api/lessons';

/**
 * Hook to fetch all lessons in a module for navigation
 * @param moduleId - The ID of the module
 * @param cohortId - The ID of the cohort
 * @returns React Query result with module lessons data
 */
export function useModuleLessons(moduleId: string, cohortId: string) {
  return useQuery({
    queryKey: ['module-lessons', moduleId, cohortId],
    queryFn: () => fetchModuleLessons(moduleId, cohortId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!moduleId && !!cohortId, // Only fetch if both IDs are provided
  });
}
