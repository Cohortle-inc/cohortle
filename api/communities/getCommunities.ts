import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Constants from 'expo-constants';

const getCommunities = async () => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken')

  const response = await axios.get(`${apiURL}/v1/api/communities`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.communities;
};

const useGetCommunities = () => {
  return useQuery({
    queryKey: ['communities'],
    queryFn: getCommunities,
    refetchOnReconnect: true,
    refetchInterval: 6000
  });
};

export default useGetCommunities;
