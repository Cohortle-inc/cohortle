import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const getLesson = async (lessonId: string) => {
  const token = await AsyncStorage.getItem('authToken');
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  try {
    const response = await axios.get(
      `${apiURL}/v1/api/lessons/${lessonId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data.lesson;
  } catch (error) {
    console.error('Error fetching Lesson: ', error);
    throw error;
  }
};

export const useGetLesson = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId),
    refetchOnReconnect: true,
    refetchInterval: 5000,
  });
};
