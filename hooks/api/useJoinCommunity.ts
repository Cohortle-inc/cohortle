import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

const joinCommunity = async (code: string) => {
  const token = await AsyncStorage.getItem('authToken');
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  try {
    const response = await axios.post(`${apiURL}/v1/api/communities/join`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to join community');
  }
};

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: joinCommunity,
    onSuccess: (data) => {
      Alert.alert('Success', 'You have joined the community successfully.');
      queryClient.invalidateQueries({ queryKey: ['learnerCohorts'] });
      router.push('/student-screens/cohorts/course');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message);
    },
  });
};
