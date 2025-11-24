import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
export interface LessonProp {
  id?: number;
  module_id: number;
  name: string;
  description?: string;
  url: string;
  order_number: number;
}
const apiURL = process.env.EXPO_PUBLIC_API_URL;
const postLesson = async (LessonData: LessonProp, id: number) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.post(
      `${apiURL}/v1/api/modules/${id}/lessons`,
      LessonData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error creating Lesson: ', error);
    throw error;
  }
};

export const usePostLesson = (id: number) => {
  return useMutation({
    mutationFn: (data: LessonProp) => postLesson(data, id),
  });
};
