import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export interface ModuleProp {
  community_id: number;
  title: string;
  order_number: number;
}
const apiURL = process.env.EXPO_PUBLIC_API_URL;
const postModule = async (data: ModuleProp, id: number) => {
  const token = await AsyncStorage.getItem('authToken');
  try {
    const response = await axios.post(
      `${apiURL}/v1/api/communities/${id}/modules`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('An error occured');
    throw error;
  }
};

export const usePostModule = (id: number) => {
  return useMutation({
    mutationFn: (data: ModuleProp) => postModule(data, id),
  });
};