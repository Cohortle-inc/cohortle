import { Stack } from 'expo-router';

type Props = {};
const Layout = (props: Props) => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="auth" />
      <Stack.Screen name="email-confirmation" />
      <Stack.Screen name="check-email" />
      <Stack.Screen name="get-started" />
      <Stack.Screen name="create-community" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="(convener)/programme-intent" />
    </Stack>
  );
};
export default Layout;
