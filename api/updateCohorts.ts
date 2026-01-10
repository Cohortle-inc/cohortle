import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface UpdateCohortParams {
  cohort_id: number;
  data: {
    name?: string;
    url?: string;
    description?: string;
    goal?: string;
    revenue?: string;
    referral?: string;
    community_structure?: string;
  };
  token: string;
}

interface UpdateCohortResponse {
  error: boolean;
  message: string;
}

export const useUpdateCohort = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateCohortResponse, Error, UpdateCohortParams>({
    mutationFn: async ({ cohort_id, data, token }) => {
      const res = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/v1/api/cohorts/${cohort_id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific cohort and the list of cohorts
      queryClient.invalidateQueries({ queryKey: ['cohort', variables.cohort_id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['convenersCohorts'] });
    },
  });
};
