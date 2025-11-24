import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const getModules = async (id: any) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(
      `${apiURL}/v1/api/communities/${id}/modules`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data.modules;
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
};

const useGetModules = (id: number | null) => {
  return useQuery({
    queryKey: ['modules', id],
    queryFn: () => getModules(id!),
    refetchInterval: 3000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: !!id,
  });
};

export default useGetModules;
