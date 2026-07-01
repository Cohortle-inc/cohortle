/**
 * React Query hook for fetching cohort details
 */

import { useQuery } from '@tanstack/react-query';
import { Cohort } from '@/lib/api/convener';
import apiClient from '@/lib/api/client';
import { toCamelCase } from '@/lib/utils/caseTransform';

interface CohortMetrics {
  memberCount: number;
  totalCompletedLessons: number;
  averageCompletionPercentage: number;
}

export interface CohortWithMetrics extends Cohort {
  metrics?: CohortMetrics;
}

/**
 * Hook to fetch cohort details including real enrolled count and metrics
 */
export function useCohortDetail(programmeId: string, cohortId: string) {
  return useQuery<CohortWithMetrics, Error>({
    queryKey: ['cohort', cohortId],
    queryFn: async () => {
      // Fetch cohort directly from the dedicated endpoint
      const [cohortRes, metricsRes] = await Promise.allSettled([
        apiClient.get(`/v1/api/cohorts/${cohortId}`),
        apiClient.get(`/v1/api/cohorts/${cohortId}/progress-summary`),
      ]);

      if (cohortRes.status === 'rejected') {
        throw new Error('Failed to fetch cohort');
      }

      const cohortData = (cohortRes.value.data as any).cohort;
      if (!cohortData) {
        throw new Error('Cohort not found');
      }

      const cohort = toCamelCase<Cohort>(cohortData);

      // Attach metrics if available
      let metrics: CohortMetrics | undefined;
      if (metricsRes.status === 'fulfilled') {
        const metricsData = (metricsRes.value.data as any).data;
        if (metricsData) {
          metrics = {
            memberCount: metricsData.member_count ?? 0,
            totalCompletedLessons: metricsData.total_completed_lessons ?? 0,
            averageCompletionPercentage: metricsData.average_completion_percentage ?? 0,
          };
        }
      }

      return { ...cohort, metrics };
    },
    staleTime: 30 * 1000,
  });
}
