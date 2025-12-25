import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

interface AddMemberPayload {
    email: string;
    role: 'learner' | 'facilitator';
}

const addCohortMember = async (cohortId: number, data: AddMemberPayload) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('No auth token');

    const response = await axios.post(
        `${apiURL}/v1/api/cohorts/${cohortId}/members`,
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const useAddCohortMember = (cohortId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AddMemberPayload) => addCohortMember(cohortId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cohort-members', cohortId] });
            Alert.alert('Success', 'Member added successfully');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.response?.data?.message || 'Failed to add member');
        },
    });
};
