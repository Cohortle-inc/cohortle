// hooks/useJoinCohort.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';
import { requireApiBaseUrl } from '@/api/apiConfig';

interface JoinCohortResponse {
  success: boolean;
  message?: string;
  cohort?: any;
}

const joinCohort = async (joinCode: string): Promise<JoinCohortResponse> => {
  const apiBaseUrl = requireApiBaseUrl();
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    Alert.alert('Session Expired', 'Please log in again.');
    throw new Error('Authentication token missing');
  }

  const response = await axios.post(
    `${apiBaseUrl}/v1/api/cohorts/join/${joinCode}`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

export const useJoinCohort = (): UseMutationResult<
  JoinCohortResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinCohort,

    onSuccess: (data, joinCode) => {
      Alert.alert('Success', 'You’ve successfully joined the community!');

      // Invalidate all cohort-related queries so they refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['cohort-learners'] }); // all learners lists
      queryClient.invalidateQueries({ queryKey: ['cohorts'] }); // your main cohorts list
      queryClient.invalidateQueries({ queryKey: ['community'] }); // if you use this key
      queryClient.invalidateQueries({ queryKey: ['joinedCohorts'] }); // common pattern

      // Optional: Optimistically update (faster UX) — advanced
      // queryClient.setQueryData(['cohorts'], (old: any) => [...])
    },

    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });
};
