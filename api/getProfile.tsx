import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';
import { requireApiBaseUrl } from '@/api/apiConfig';

export const getProfile = async () => {
  try {
    const apiBaseUrl = requireApiBaseUrl();
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${apiBaseUrl}/v1/api/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Normalize the response structure
    // If API returns { message: { first_name, ... } }, flatten it
    const profileData = response.data?.message || response.data?.user || response.data;
    
    return profileData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load profile.';
    console.error('Profile fetch error:', errorMessage);
    throw new Error(errorMessage);
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
