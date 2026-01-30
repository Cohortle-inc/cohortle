import { Alert } from 'react-native';

export const getApiBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;

export const requireApiBaseUrl = () => {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    Alert.alert(
      'Configuration Error',
      'EXPO_PUBLIC_API_URL is not defined. Please check your environment variables.',
    );
    throw new Error('Missing EXPO_PUBLIC_API_URL');
  }

  return baseUrl;
};
