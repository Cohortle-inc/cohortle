import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

const getLearnerCohorts = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  if (!apiURL) {
    throw new Error('API configuration is missing. Please contact support.');
  }

  if (!token) {
    throw new Error('You are not logged in. Please log in to view your cohorts.');
  }

  try {
    const response = await axios.get(`${apiURL}/v1/api/communities/joined`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.communities;
  } catch (error: any) {
    console.error('Get learner cohorts error:', error?.response?.data || error?.message);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;
      
      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 404) {
        throw new Error('No cohorts found. Join a community to get started!');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message) {
        throw new Error(message);
      }
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to load your cohorts. Please check your connection and try again.');
  }
};

export const useGetLearnerCohorts = () => {
  return useQuery({
    queryKey: ['learnerCohorts'],
    queryFn: getLearnerCohorts,
    refetchInterval: 7000,
    staleTime: 500,
    refetchOnReconnect: true,
  });
};
