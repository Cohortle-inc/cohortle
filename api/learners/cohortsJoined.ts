import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

const getLearnerCohorts = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  try {
    const response = await axios.get(`${apiURL}/v1/api/learner/cohorts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data.communities);
    return response.data.communities;
  } catch (error) {
    throw new Error('API call failed');
  }
};

export const useGetLearnerCohorts = () => {
  return useQuery({
    queryKey: ['learnerCohorts'],
    queryFn: getLearnerCohorts,
    refetchInterval: 15000,
    staleTime: 500,
    refetchOnReconnect: true,
  });
};
