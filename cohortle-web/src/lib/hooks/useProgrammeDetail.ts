/**
 * React Query hook for fetching and managing programme details
 * Provides caching, loading states, and error handling for programme detail data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProgramme,
  updateProgramme,
  publishProgramme,
  ProgrammeDetail,
  ProgrammeFormData,
} from '@/lib/api/convener';

/**
 * Hook to fetch programme details including cohorts, weeks, and lessons
 * @param programmeId - The ID of the programme to fetch
 * @returns React Query result with programme detail data, loading state, error state, and mutation functions
 */
export function useProgrammeDetail(programmeId: string) {
  const queryClient = useQueryClient();

  // Fetch programme detail query
  const query = useQuery<ProgrammeDetail, Error>({
    queryKey: ['convener', 'programmes', programmeId],
    queryFn: () => getProgramme(programmeId),
    staleTime: 0, // Always refetch on navigation to pick up new weeks/cohorts
    enabled: !!programmeId,
  });

  // Update programme mutation
  const updateMutation = useMutation<
    ProgrammeDetail,
    Error,
    Partial<ProgrammeFormData>
  >({
    mutationFn: async (data) => {
      await updateProgramme(programmeId, data);
      // Refetch to get the updated programme with all nested data
      return getProgramme(programmeId);
    },
    onSuccess: (updatedProgramme) => {
      // Update the cache with the new programme data
      queryClient.setQueryData<ProgrammeDetail>(
        ['convener', 'programmes', programmeId],
        updatedProgramme
      );
      
      // Also invalidate the programmes list to reflect changes
      queryClient.invalidateQueries({
        queryKey: ['convener', 'programmes'],
      });
    },
  });

  // Publish programme mutation
  const publishMutation = useMutation<ProgrammeDetail, Error, void>({
    mutationFn: async () => {
      await publishProgramme(programmeId);
      // Refetch to get the updated programme with new status
      return getProgramme(programmeId);
    },
    onSuccess: (updatedProgramme) => {
      // Update the cache with the new programme data
      queryClient.setQueryData<ProgrammeDetail>(
        ['convener', 'programmes', programmeId],
        updatedProgramme
      );
      
      // Also invalidate the programmes list to reflect status change
      queryClient.invalidateQueries({
        queryKey: ['convener', 'programmes'],
      });
    },
  });

  return {
    // Query data
    programme: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    
    // Query actions
    refetch: query.refetch,
    
    // Update mutation
    updateProgramme: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    // Publish mutation
    publishProgramme: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
  };
}
