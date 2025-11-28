import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const getCommunities = async (cohortId: number) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(
      `${apiURL}/v1/api/cohorts/${cohortId}/communities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      },
    );
    console.log(response.data);
    return response.data.communities;
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
};

const useGetCommunities = (cohortId: number) => {
  return useQuery({
    queryKey: ['communities', cohortId],
    queryFn: () => getCommunities(cohortId),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: 7000,
    staleTime: 0,
    enabled: !!cohortId,
  });
};

export default useGetCommunities;
