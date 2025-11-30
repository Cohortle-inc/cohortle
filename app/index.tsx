import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/lib/supabase';
import { getItem } from '../utils/asyncStorage';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const userDataString = await AsyncStorage.getItem('userData');
      console.log(userDataString); // This will show the string: "{\"id\":24,\"email\":\"u@a.com\",\"role\":\"convener\"}"
      
      // Parse the string to get the user object
      const user = userDataString ? JSON.parse(userDataString) : null;
      console.log(user); // This will show the parsed object
      
      const onboarded = await getItem('onboarded');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log(onboarded);

      if (!onboarded) {
        router.replace('/(auth)/onboarding');
        return; // Early return to avoid further checks
      }
      // else if (user?.role === 'convener') {
      //   router.replace('/convener-screens/(cohorts)'); 
      // }
      // else if (user?.role === 'learner') {
      //   router.replace('/student-screens/cohorts'); 
      // }
      else {
        router.replace('/(auth)/auth');
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