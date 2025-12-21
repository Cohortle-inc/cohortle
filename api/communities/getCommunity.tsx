import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const getCommunity = async (id: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(
      `${apiURL}/v1/api/communities/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log(response.data.community);
    return response.data.community;
  } catch (error) {
    console.error('Error fetching community:', error);
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
