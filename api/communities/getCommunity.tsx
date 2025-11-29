import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const getCommunity = async (cohortId: number, id: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(
      `${apiURL}/v1/api/cohorts/${cohortId}/communities/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching community:', error);
    throw error;
  }
};

const useGetCommunity = (cohortId: number, id: string) => {
  return useQuery({
    queryKey: ['community', cohortId],
    queryFn: () => getCommunity(cohortId, id),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: !!cohortId,
  });
};

export default useGetCommunity;
