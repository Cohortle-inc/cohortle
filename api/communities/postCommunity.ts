import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

export interface CommunityType {
  id?: string;
  cohort_id: number;
  name: string;
  description: string;
  // type: string;
  sub_type: string;
}

const postCommunity = async (communityData: CommunityType, id: number) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.post(
      `${apiURL}/v1/api/cohorts/${id}/communities`,
      communityData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
};

export const usePostCommunity = (id: number) => {
  return useMutation({
    mutationFn: (data: CommunityType) => postCommunity(data, id),
  });
};
