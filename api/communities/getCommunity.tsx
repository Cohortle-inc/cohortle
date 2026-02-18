import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { requireApiBaseUrl } from '../apiConfig';

const getCommunity = async (id: string) => {
  const apiURL = requireApiBaseUrl();
  const token = await AsyncStorage.getItem('authToken');

  try {
    const response = await axios.get(`${apiURL}/v1/api/communities/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.community;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching community: status=', error.response?.status);
    }
    console.error('Error fetching community:', error?.message || 'Unknown error');
    throw error;
  }
};

const useGetCommunity = (id: string) => {
  return useQuery({
    queryKey: ['community'],
    queryFn: () => getCommunity(id),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};

export default useGetCommunity;
