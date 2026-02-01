import { Redirect } from 'expo-router';
export default function InitialScreen() {
  return <Redirect href="/(auth)/auth" />;
}
