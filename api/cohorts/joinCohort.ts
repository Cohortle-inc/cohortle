import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';

export const useJoinCohort = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (cohortId: number) => {
            const token = await AsyncStorage.getItem('authToken');
            const apiURL = process.env.EXPO_PUBLIC_API_URL;

            const response = await axios.post(
                `${apiURL}/v1/api/cohorts/${cohortId}/join`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cohorts'] });
            queryClient.invalidateQueries({ queryKey: ['programmeMembership'] });
            Alert.alert('Success', 'You have successfully joined the cohort!');
        },
        onError: (error: any) => {
            console.error('Join cohort error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to join cohort. Please try again.'
            );
        },
    });
};
