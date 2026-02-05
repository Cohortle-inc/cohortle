import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '@/api/getProfile';

export default function InitialScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        if (!token) {
          router.replace('/(auth)/auth');
          return;
        }

        const profile = await getProfile();

        if (profile?.role === 'convener') {
          router.replace('/convener-screens/(cohorts)');
        } else if (profile?.role === 'student') {
          router.replace('/student-screens/cohorts');
        } else {
          // Fallback if role is missing or unknown
          router.replace('/(auth)/auth');
        }

      } catch (error) {
        console.error('Error checking auth/profile:', error);
        router.replace('/(auth)/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#391D65" />
      </View>
    );
  }

  return null; // Component will unmount after redirect
}
