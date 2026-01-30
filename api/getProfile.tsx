import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';
import { requireApiBaseUrl } from '@/api/apiConfig';

export const getProfile = async () => {
  try {
    const apiBaseUrl = requireApiBaseUrl();
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${apiBaseUrl}/v1/api/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data; // Returning full data including user object
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to load profile.');
    throw error;
  }
};

export const useGetProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
