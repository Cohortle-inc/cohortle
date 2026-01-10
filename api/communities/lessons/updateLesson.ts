import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useEditLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lesson_id,
      data,
    }: {
      lesson_id: number;
      data: any;
    }) => {
      const token = await AsyncStorage.getItem('authToken');
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const response = await axios.put(
        `${apiURL}/v1/api/lessons/${lesson_id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate modules list and specifically the modified lesson if it has its own query key
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lesson_id] });
    },
  });
};
