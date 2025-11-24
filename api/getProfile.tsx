import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const apiURL = process.env.EXPO_PUBLIC_API_URL;
export const getProfile = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const response = await axios.get(`${apiURL}/v1/api/profile`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  console.log(response);
  return response.data.message;
};
