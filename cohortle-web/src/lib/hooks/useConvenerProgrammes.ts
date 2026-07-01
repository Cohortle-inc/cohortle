/**
 * React Query hook for fetching and managing convener programmes
 * Provides caching, loading states, and error handling for programme data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyProgrammes,
  createProgramme,
  Programme,
  ProgrammeFormData,
} from '@/lib/api/convener';

/**
 * Hook to fetch all programmes created by the current convener
 * @returns React Query result with programmes data, loading state, error state, and refetch function
 */
export function useConvenerProgrammes() {
  const queryClient = useQueryClient();

  // Fetch programmes query
  const query = useQuery<Programme[], Error>({
    queryKey: ['convener', 'programmes'],
    queryFn: getMyProgrammes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create programme mutation
  const createMutation = useMutation<Programme, Error, ProgrammeFormData>({
    mutationFn: createProgramme,
    onSuccess: (newProgramme) => {
      // Optimistically update the cache with the new programme
      queryClient.setQueryData<Programme[]>(
        ['convener', 'programmes'],
        (old) => (old ? [...old, newProgramme] : [newProgramme])
      );
    },
  });

  return {
    // Query data
    programmes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    
    // Query actions
    refetch: query.refetch,
    
    // Mutation actions
    createProgramme: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
