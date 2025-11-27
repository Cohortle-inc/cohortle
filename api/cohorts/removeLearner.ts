// hooks/useRemoveCohortLearner.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

interface RemoveLearnerParams {
  cohortId: string;
  learnerId: string | number;
}

// Correct API call to remove a learner
const removeCohortLearner = async ({
  cohortId,
  learnerId,
}: RemoveLearnerParams) => {
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    Alert.alert('Error', 'You are not authenticated. Please log in again.');
    throw new Error('No auth token');
  }

  try {
    const response = await axios.delete(
      `${apiURL}/v1/api/cohorts/${cohortId}/learners/${learnerId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error(
      'Failed to remove learner:',
      error.response?.data || error.message,
    );

    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to remove learner. Please try again.';

    Alert.alert('Error', message);
    throw error; // Important: re-throw so mutation knows it failed
  }
};

// Custom hook
export const useRemoveCohortLearner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCohortLearner,

    // Optional: Optimistic update + refetch
    onSuccess: (_, variables) => {
      // Invalidate the learners list so it refetches
      queryClient.invalidateQueries({
        queryKey: ['cohortLearners', variables.cohortId],
      });

      // Or if you're using a cohort details query
      queryClient.invalidateQueries({
        queryKey: ['cohort', variables.cohortId],
      });

      Alert.alert('Success', 'Learner removed successfully');
    },

    onError: (error) => {
      console.error('Mutation error:', error);
      // Alert already shown in API function
    },
  });
};
