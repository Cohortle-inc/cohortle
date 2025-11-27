import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

const getPublishedLessons = async (id: number) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(`${apiURL}/v1/api/modules/${id}/lessons`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'cache-control': 'no-cache',
      },
    });
    return response.data.lessons.filter(
      (lesson: any) => lesson.status === 'published',
    );
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

export const useGetPublishedLessons = (id: number | null) => {
  return useQuery({
    queryKey: ['published-lessons', id],
    queryFn: () => getPublishedLessons(id!),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    // staleTime: 0,
    enabled: !!id,
  });
};
