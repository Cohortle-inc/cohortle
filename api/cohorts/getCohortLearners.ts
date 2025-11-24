import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const getCohortLearners = async (id: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken');

  if (!apiURL) throw new Error('Missing API URL');
  if (!token) throw new Error('Missing auth token');

  try {
    const response = await axios.get(`${apiURL}/v1/api/cohorts/${id}/learners`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
    });

    console.log("ppp: ", response.data.learners)
    return response.data.learners;
  } catch (error: any) {
    console.error(
      'Error fetching cohort:',
      error?.response?.data || error.message,
    );
    throw new Error(`Failed to fetch cohort ${id}`);
  }
};
export const useGetCohortLearners = (id: string | undefined) => {
  return useQuery({
    queryKey: ['cohort-learners', id],
    queryFn: () => getCohortLearners(id as string),
    refetchOnReconnect: true,
    refetchInterval: 5000,
    staleTime: 0
  });
};
