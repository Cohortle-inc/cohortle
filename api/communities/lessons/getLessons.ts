import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

const getLessons = async (id: number) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(`${apiURL}/v1/api/modules/${id}/lessons`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'cache-control': 'no-cache',
      },
    });
    return response.data.lessons;
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

export const useGetLessons = (id: number | null) => {
  return useQuery({
    queryKey: ['lessons', id],
    queryFn: () => getLessons(id!),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    // staleTime: 0,
    enabled: !!id,
  });
};
