// hooks/useGetCohortLearners.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getCohortLearners = async (id: string) => {
  const token = await AsyncStorage.getItem('authToken');

  if (!API_URL) throw new Error('Missing API URL');
  if (!token) throw new Error('Missing auth token');

  const response = await axios.get(`${API_URL}/v1/api/cohorts/${id}/learners`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.learners;
};

export const useGetCohortLearners = (cohortId: string | undefined) => {
  return useQuery({
    queryKey: ['joinedCohorts', cohortId], // consistent key
    queryFn: () => getCohortLearners(cohortId!),
    enabled: !!cohortId, // only run if ID exists
    staleTime: 5000, // 30 seconds
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
};
