import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const getModule = async (id: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.get(
      `${apiURL}/v1/api/communities/:community_id/modules/${module}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log(response.data);
    return response.data.modules;
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
};

const useGetModule = (id: string) => {
  return useQuery({
    queryKey: ['modules', id],
    queryFn: () => getModule(id),
    staleTime: 0,
    enabled: !!id,
  });
};

export default useGetModule;
