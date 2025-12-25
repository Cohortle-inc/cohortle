import { CohortType } from '@/types/cohortType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Alert } from 'react-native';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

const createCohort = async (programmeId: number, data: CohortType) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
        Alert.alert(
            'Authentication Error',
            'No auth token found. Please log in again.',
        );
        throw new Error('No auth token');
    }

    const response = await axios.post(`${apiURL}/v1/api/programmes/${programmeId}/cohorts`, data, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(response.data)
    return response.data;
};

export const useCreateCohort = (programmeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CohortType) => createCohort(programmeId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cohorts', programmeId] });
        },
    });
};
