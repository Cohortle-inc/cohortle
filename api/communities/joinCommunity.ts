import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface JoinCommunityData {
  code: string;
}

const joinCommunity = async (data: JoinCommunityData) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken');

  const response = await axios.post(`${apiURL}/v1/api/communities/join`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinCommunity,
    onSuccess: () => {
      // Invalidate and refetch queries that should be updated after joining a community
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities'] });
    },
  });
};

export default useJoinCommunity;
