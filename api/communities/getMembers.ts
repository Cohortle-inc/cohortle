import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const getCommunityMembers = async (communityId: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(`${apiURL}/v1/api/communities/${communityId}/members`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.members;
  } catch (error) {
    console.error('Error getting community members:', error);
    throw error;
  }
};

export const useGetCommunityMembers = (communityId: string) => {
  return useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => getCommunityMembers(communityId),
    refetchInterval: 6000, // Refetch every 60 seconds
  });
};