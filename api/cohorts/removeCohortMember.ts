import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

interface RemoveMemberParams {
    cohortId: number;
    memberId: number;
}

const removeCohortMember = async ({ cohortId, memberId }: RemoveMemberParams) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('No auth token');

    const response = await axios.delete(
        `${apiURL}/v1/api/cohorts/${cohortId}/members/${memberId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const useRemoveCohortMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: removeCohortMember,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cohort-members', variables.cohortId] });
            Alert.alert('Success', 'Member removed successfully');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.response?.data?.message || 'Failed to remove member');
        },
    });
};
