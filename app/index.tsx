import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/lib/supabase';
import { getItem } from '../utils/asyncStorage';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function InitialScreen() {
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      const onboarded = await getItem('onboarded');
      console.log(onboarded);

      if (!onboarded) {
        router.replace('/(auth)/onboarding');
        return;
      }
      else {
        router.replace('/(auth)/login');
      }
    };

    initialize();
  }, []);

  // Show a loading indicator while deciding where to route the user
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}