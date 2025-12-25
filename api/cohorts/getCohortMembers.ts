import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getCohortMembers = async (cohortId: number) => {
    const token = await AsyncStorage.getItem('authToken');

    if (!API_URL) throw new Error('Missing API URL');
    if (!token) throw new Error('Missing auth token');

    const response = await axios.get(`${API_URL}/v1/api/cohorts/${cohortId}/members`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(response.data)
    return response.data;
};

export const useGetCohortMembers = (cohortId: number | undefined) => {
    return useQuery({
        queryKey: ['cohort-members', cohortId],
        queryFn: () => getCohortMembers(cohortId!),
        enabled: !!cohortId,
        refetchOnReconnect: true,
    });
};
