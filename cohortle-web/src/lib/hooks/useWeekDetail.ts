/**
 * React Query hook for fetching week details with lessons
 */

import { useQuery } from '@tanstack/react-query';
import { WeekWithLessons } from '@/lib/api/convener';
import apiClient from '@/lib/api/client';

interface WeekDetailResponse {
  error: boolean;
  message: string;
  weeks?: WeekWithLessons[];
}

/**
 * Hook to fetch week details including lessons
 * @param programmeId - Programme ID
 * @param weekId - Week ID
 * @returns React Query result with week data
 */
export function useWeekDetail(programmeId: string, weekId: string) {
  return useQuery<WeekWithLessons, Error>({
    queryKey: ['week', weekId],
    queryFn: async () => {
      // Fetch all weeks for the programme
      const response = await apiClient.get<WeekDetailResponse>(
        `/v1/api/programmes/${programmeId}/weeks`
      );

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to fetch week');
      }

      // Find the specific week
      const week = response.data.weeks?.find((w) => w.id === weekId);

      if (!week) {
        throw new Error('Week not found');
      }

      return {
        id: week.id,
        programmeId: week.programmeId,
        weekNumber: week.weekNumber,
        title: week.title,
        startDate: week.startDate,
        createdAt: week.createdAt,
        updatedAt: week.updatedAt,
        lessons: week.lessons || [],
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
