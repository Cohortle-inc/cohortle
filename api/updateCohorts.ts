import { useMutation } from '@tanstack/react-query';
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
  });
};
