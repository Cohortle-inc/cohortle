import { CohortType } from '@/types/cohortType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

const createCohort = async (CohortData: CohortType) => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    Alert.alert(
      'Authentication Error',
      'No auth token found. Please log in again.',
    );
  }
  try {
    const response = await axios.post(`${apiURL}/v1/api/cohorts`, CohortData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
  }
};

export const useCreateCohort = () => {
  return useMutation({
    mutationFn: (data: CohortType) => createCohort(data),
  });
};
