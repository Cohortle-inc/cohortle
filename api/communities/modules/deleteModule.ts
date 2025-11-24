// api/communities/modules/deleteModule.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

interface DeleteModuleParams {
  community_id: number;
  module_id: number;
}

const deleteModuleFn = async ({ community_id, module_id }: DeleteModuleParams) => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) throw new Error('No auth token');

  await axios.delete(`${apiURL}/v1/api/communities/${community_id}/modules/${module_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModuleFn,
    onSuccess: (_, variables) => {
      const { community_id } = variables;
      // Invalidate modules list for this community
      queryClient.invalidateQueries({ queryKey: ['modules', community_id] });
    },
    onError: (error: any) => {
      console.error('Failed to delete module:', error.response?.data || error.message);
    },
  });
};