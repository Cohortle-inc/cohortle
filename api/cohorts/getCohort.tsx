import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const getCohort = async (id: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken');

  if (!apiURL) throw new Error('Missing API URL');
  if (!token) throw new Error('Missing auth token');

  try {
    const response = await axios.get(`${apiURL}/v1/api/cohorts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
    });
    console.log('Cohort API response:', response.data);
    const cohort = response.data?.cohort ?? response.data ?? null;

    if (!cohort) {
      console.warn(`No cohort found for ID: ${id}`);
      return null;
    }
    return cohort;
  } catch (error: any) {
    console.error(
      'Error fetching cohort:',
      error?.response?.data || error.message,
    );
    throw new Error(`Failed to fetch cohort ${id}`);
  }
};
export const useGetCohort = (id: string | undefined) => {
  return useQuery({
    queryKey: ['cohort', id],
    queryFn: () => getCohort(id as string),
    refetchInterval: 15000,
    refetchOnReconnect: true
  });
};
