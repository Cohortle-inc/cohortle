import { Stack } from 'expo-router';
import React from 'react';

const Profile = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
};

export default Profile;
