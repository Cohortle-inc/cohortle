import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ThemeProvider } from '@shopify/restyle';
import theme from '@/theme/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FlashMessage from "react-native-flash-message";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    DMSansRegular: require('../assets/fonts/DMSans-Regular.ttf'),
    DMSansBold: require('../assets/fonts/DMSans-Bold.ttf'),
    DMSansMedium: require('../assets/fonts/DMSans-Medium.ttf'),
    DMSansLight: require('../assets/fonts/DMSans-Light.ttf'),
    DMSansSemiBold: require('../assets/fonts/DMSans-SemiBold.ttf'),
  });
  

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GestureHandlerRootView>
          <Stack screenOptions={{ headerShown: false }}>
            
            <Stack.Screen name="(tabs)" />
          </Stack>
          <FlashMessage position="top"
            floating={true}
            duration={3000}
            style={{ marginTop: 50 }} />
        </GestureHandlerRootView>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
