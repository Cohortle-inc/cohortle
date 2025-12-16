import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Constants from 'expo-constants';

const getCommunities = async (cohortId: number) => {
  // Resolve API URL from env, expo constants extra, or fallback to a known prod URL.
  const apiURL =
    (process.env.EXPO_PUBLIC_API_URL as string) ||
    (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_API_URL ||
    'https://cohortle-api.onrender.com';

  const token = await AsyncStorage.getItem('authToken');

  // Helpful runtime diagnostics when builds behave differently
  // (dev vs preview). Remove or reduce logs in production if needed.
  // eslint-disable-next-line no-console
  console.log('[getCommunities] apiURL:', apiURL);
  // eslint-disable-next-line no-console
  console.log('[getCommunities] token present:', !!token);

  try {
    const response = await axios.get(
      `${apiURL}/v1/api/cohorts/${cohortId}/communities`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Cache-Control': 'no-cache',
        },
      },
    );
    return response.data.communities;
  } catch (error: any) {
    // Print useful axios error details so we can see status / body in preview builds
    // eslint-disable-next-line no-console
    console.error('[getCommunities] Error fetching communities:');
    // eslint-disable-next-line no-console
    console.error('message:', error.message);
    if (error.response) {
      // eslint-disable-next-line no-console
      console.error('status:', error.response.status);
      // eslint-disable-next-line no-console
      console.error('data:', error.response.data);
    }
    throw error;
  }
};

const useGetCommunities = (cohortId: number) => {
  return useQuery({
    queryKey: ['communities', cohortId],
    queryFn: () => getCommunities(cohortId),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: 7000,
    staleTime: 0,
    enabled: !!cohortId,
  });
};

export default useGetCommunities;
