import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

const convenersCohorts = async () => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(`${apiURL}/v1/api/cohorts/owner`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.cohorts;
  } catch (error) {
    console.error("Error fetching convener's cohorts:", error);
    throw error;
  }
};

export const useConvenersCohorts = () => {
  return useQuery({
    queryKey: ['convenersCohorts'],
    queryFn: convenersCohorts,
    // ensure the data stays up todaate
    refetchInterval: 5000,
    refetchOnReconnect: true,
  });
};
