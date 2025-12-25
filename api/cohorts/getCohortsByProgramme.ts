import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL;

const getCohortsByProgramme = async (programmeId: number) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Missing auth token');

    const response = await axios.get(`${apiURL}/v1/api/programmes/${programmeId}/cohorts`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
        },
    });
    console.log(response.data);
    return response.data;
};

export const useGetCohortsByProgramme = (programmeId: number) => {
    return useQuery({
        queryKey: ['cohorts', programmeId],
        queryFn: () => getCohortsByProgramme(programmeId),
        enabled: !!programmeId,
        refetchOnReconnect: true,
    });
};
