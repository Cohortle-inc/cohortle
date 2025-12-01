import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL;
export const getProfile = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const response = await axios.get(`${apiURL}/v1/api/profile`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  console.log(response.data.message);
  return response.data.message;
};

export const useGetProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    // refetchOnReconnect: true,
    refetchInterval: 5000,
    // staleTime: 1,
  });
};
