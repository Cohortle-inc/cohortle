/**
 * React Query hooks for progress tracking
 * Provides hooks for fetching and managing progress data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  ProgrammeProgress,
  WeekProgress,
  ModuleProgress,
  calculateWeekProgress,
  calculateProgrammeProgress,
  calculateModuleProgress,
  updateProgressAfterCompletion,
} from '@/lib/utils/progressCalculation';
import { getProgrammeWeeks, getModuleLessons } from '@/lib/api/programmes';

/**
 * Hook to fetch and calculate programme progress
 * @param programmeId - ID of the programme
 * @param cohortId - ID of the cohort (optional)
 * @returns Programme progress data with loading and error states
 */
export function useProgrammeProgress(programmeId: string, cohortId?: string) {
  return useQuery<ProgrammeProgress, Error>({
    queryKey: ['programme-progress', programmeId, cohortId],
    queryFn: async () => {
      // Fetch weeks with lessons and completion status
      const weeks = await getProgrammeWeeks(programmeId, cohortId);
      
      // Calculate progress for each week
      const weekProgressData: WeekProgress[] = weeks.map(week => 
        calculateWeekProgress(
          week.id,
          week.title,
          week.lessons.map(lesson => ({
            id: lesson.id,
            isCompleted: false, // TODO: Get actual completion status from API
          }))
        )
      );

      // Calculate overall programme progress
      const programmeName = weeks.length > 0 ? weeks[0].title : 'Programme';
      return calculateProgrammeProgress(programmeId, programmeName, weekProgressData);
    },
    enabled: !!programmeId,
    staleTime: 30 * 1000, // 30 seconds - progress data changes frequently
  });
}

/**
 * Hook to fetch and calculate module progress
 * @param moduleId - ID of the module
 * @returns Module progress data with loading and error states
 */
export function useModuleProgress(moduleId: string) {
  return useQuery<ModuleProgress, Error>({
    queryKey: ['module-progress', moduleId],
    queryFn: async () => {
      // Fetch module lessons with completion status
      const response = await getModuleLessons(moduleId);
      
      // Calculate module progress
      return calculateModuleProgress(
        moduleId,
        response.module.name,
        response.data.map(lesson => ({
          id: lesson.id,
          isCompleted: lesson.isCompleted,
        }))
      );
    },
    enabled: !!moduleId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to update progress after lesson completion
 * Provides a function to update progress in the cache without refetching
 * @returns Function to update progress after completion
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  const updateProgress = useCallback(
    (programmeId: string, weekId: string, lessonId: string, cohortId?: string) => {
      // Update the programme progress in the cache
      queryClient.setQueryData<ProgrammeProgress>(
        ['programme-progress', programmeId, cohortId],
        (oldData) => {
          if (!oldData) return oldData;
          return updateProgressAfterCompletion(oldData, weekId, lessonId);
        }
      );

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['programme-progress', programmeId],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['module-progress'],
      });
    },
    [queryClient]
  );

  return updateProgress;
}

/**
 * Hook to invalidate all progress queries
 * Useful after bulk operations or when progress data needs to be refreshed
 * @returns Function to invalidate all progress queries
 */
export function useInvalidateProgress() {
  const queryClient = useQueryClient();

  const invalidateAllProgress = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['programme-progress'],
    });
    queryClient.invalidateQueries({
      queryKey: ['module-progress'],
    });
    queryClient.invalidateQueries({
      queryKey: ['lesson-completion'],
    });
  }, [queryClient]);

  return invalidateAllProgress;
}
