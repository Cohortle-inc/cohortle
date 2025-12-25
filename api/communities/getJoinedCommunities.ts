import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const getJoinedCommunities = async () => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken');

  const response = await axios.get(`${apiURL}/v1/api/communities/joined`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.communities;
};

const useGetJoinedCommunities = () => {
  return useQuery({
    queryKey: ['joinedCommunities'],
    queryFn: getJoinedCommunities,
    refetchOnReconnect: true,
  });
};

export default useGetJoinedCommunities;
