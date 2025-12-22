import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

interface EditModuleParams {
  module_id: number;
  data: {
    title?: string;
    description?: string;
    status?: 'published' | 'draft';
    order_number?: number;
  };
}

const updateModule = async ({
  module_id,
  data,
}: EditModuleParams) => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');

  const response = await axios.put(
    `${apiURL}/v1/api/modules/${module_id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
};

export const useEditModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateModule,

    onSuccess: (updatedModule, variables) => {
      const { module_id } = variables;

      // Instant UI update in modules list
      queryClient.setQueryData(['modules'], (old: any) =>
        old?.map((m: any) =>
          m.id === module_id ? { ...m, ...updatedModule } : m,
        ),
      );

      // Update single module if cached
      queryClient.setQueryData(['module', module_id], updatedModule);

      // Invalidate as safe fallback
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['module', module_id] });
    },

    onError: (error: any) => {
      console.error(
        'Failed to update module:',
        error.response?.data || error.message,
      );
    },
  });
};
