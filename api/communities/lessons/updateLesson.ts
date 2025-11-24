// hooks/useEditLesson.ts
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useEditLesson = () => {
  return useMutation({
    mutationFn: async ({
      module_id,
      lesson_id,
      data,
    }: {
      module_id: number;
      lesson_id: number;
      data: any;
    }) => {
      const token = await AsyncStorage.getItem('authToken');
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const response = await axios.put(
        `${apiURL}/v1/api/modules/${module_id}/lessons/${lesson_id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
  });
};
