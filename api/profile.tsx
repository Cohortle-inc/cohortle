// api/profile.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileProp from '@/types/profileType';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Token Interceptor (keeps working the same)
api.interceptors.request.use(async (config) => {
  const authToken = await AsyncStorage.getItem('authToken');
  const initialToken = await AsyncStorage.getItem('initialToken');
  let tokenToUse = authToken || initialToken;

  if (config.headers?._useInitialToken) {
    tokenToUse = initialToken;
    delete config.headers._useInitialToken;
  } else if (config.headers?._useAuthToken) {
    tokenToUse = authToken;
    delete config.headers._useAuthToken;
  }

  if (tokenToUse) {
    config.headers.Authorization = `Bearer ${tokenToUse}`;
  }
  console.log(tokenToUse === initialToken);

  return config;
});

export interface UpdateProfileResponse {
  error: boolean;
  message: {
    FIRSTNAME: string;
    LASTNAME: string;
    USERNAME: string;
    LOCATION?: string;
    SOCIALS?: string;
    PROFILE_IMAGE?: string;
    BIO?: string;
  };
}

// ✅ Modified function to accept tokenType
export const updateProfile = async (
  data: ProfileProp,
  tokenType: 'authToken' | 'initialToken' = 'authToken',
): Promise<UpdateProfileResponse> => {
  const formData = new FormData();

  if (data.first_name) formData.append('first_name', data.first_name);
  if (data.last_name) formData.append('last_name', data.last_name);
  if (data.username) formData.append('username', data.username);
  if (data.password) formData.append('password', data.password);
  if (data.bio) formData.append('bio', data.bio);
  if (data.location) formData.append('location', data.location);
  if (data.socials) formData.append('socials', data.socials);

  if (data.image) {
    formData.append('image', {
      uri: data.image.uri,
      type: data.image.type || 'image/jpeg',
      name: data.image.name || 'profile.jpg',
    } as any);
  }

  // ✅ Use the header flag to tell the interceptor which token to use
  const headers: any = { 'Content-Type': 'multipart/form-data' };
  if (tokenType === 'initialToken') headers._useInitialToken = true;
  else headers._useAuthToken = true;

  const response = await api.put('/v1/api/profile', formData, { headers });
  return response.data;
};
