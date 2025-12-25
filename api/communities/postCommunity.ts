import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

export interface CommunityType {
  name: string;
  description: string;
  type: string;
  codePrefix?: string;
  thumbnail?: string;
}

const postCommunity = async (communityData: CommunityType) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.post(
      `${apiURL}/v1/api/communities`,
      communityData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating community:', error.response.data);
    throw new Error(error.response?.data?.message || 'Failed to create community');
  }
};

export const usePostCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postCommunity,
    onSuccess: (data) => {
      showMessage({
        message: 'Success',
        description: 'Community created successfully',
        type: 'success',
        icon: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (error: Error) => {
      showMessage({
        message: 'Error',
        description: error.message,
        type: 'danger',
        icon: 'danger',
      });
    },
  });
};
