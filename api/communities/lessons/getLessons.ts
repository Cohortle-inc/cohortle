import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

const getLessons = async (id: number, cohortId?: number) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const url = cohortId
      ? `${apiURL}/v1/api/modules/${id}/lessons?cohort_id=${cohortId}`
      : `${apiURL}/v1/api/modules/${id}/lessons`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'cache-control': 'no-cache',
      },
    });
    return response.data.lessons;
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

export const useGetLessons = (id: number | null, cohortId?: number | null) => {
  return useQuery({
    queryKey: ['lessons', id, cohortId],
    queryFn: () => getLessons(id!, cohortId || undefined),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    enabled: !!id,
  });
};
