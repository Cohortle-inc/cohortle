// api/cohorts/postCohort.ts
import { CohortType } from '@/types/cohortType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

const createCohort = async (cohortData: CohortType) => {
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await axios.post(`${apiURL}/v1/api/cohorts`, cohortData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const useCreateCohort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCohort,
    onSuccess: () => {
      // ✅ INVALIDATE cohorts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['conveners-cohorts'] });

      // ✅ Show success message
      showMessage({
        message: 'Success!',
        description: 'Cohort created successfully',
        type: 'success',
        backgroundColor: '#391D65',
        color: '#fff',
        icon: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.error('Create cohort error:', error);

      // ✅ Show specific error messages
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create cohort. Please try again.';

      showMessage({
        message: 'Error',
        description: errorMessage,
        type: 'danger',
        backgroundColor: '#EE3D3E',
        color: '#fff',
        icon: 'danger',
        duration: 4000,
      });
    },
  });
};
