import { Stack } from 'expo-router';

type Props = {};
const _layout = (props: Props) => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="home" />
      {/* <Stack.Screen name="signUp" /> */}
    </Stack>
  );
};
export default _layout;
