import { Alert, Pressable, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import { FormData, UpdateProfileResponse } from '@/types/profileFormProp';

// --- Axios instance ---
const createAxiosInstance = (token: string) => {
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  return axios.create({
    baseURL: apiURL,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
};

const CommunityInfo = () => {
  const [data, setData] = useState<FormData>({
    username: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { token } = useLocalSearchParams<{ token?: string }>();

  const handleChange = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes to save.');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication token is missing.');
      return;
    }

    if (!data.username || !data.password) {
      Alert.alert('Incomplete Fields', 'Please fill all fields.');
      return;
    }

    if (data.password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const axiosInstance = createAxiosInstance(token);

      const updateData = {
        username: data.username,
        password: data.password,
      };

      const response = await axiosInstance.put<UpdateProfileResponse>(
        '/v1/api/profile',
        updateData,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (response.data.error) {
        Alert.alert(
          'Update Failed',
          'Failed to update profile. Please try again.',
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
        router.push(`/(auth)/login`);
      }
    } catch (error: any) {
      console.error('Update Error:', error);
      const message = error.response?.data?.message;
      error.message || 'Something went wrong while updating your profile.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper style={styles.container}>
      <View style={{ marginTop: 24 }}>
        <Header number={2} total={2} />
        <Text style={styles.header}>What username do you want to use?</Text>

        <Input
          label="Username"
          value={data.username}
          onChangeText={(value: string) => handleChange('username', value)}
          placeholder="Username"
        />
      </View>

      <View>
        <Text style={styles.header}>Set Password</Text>

        <Input
          label="Password"
          value={data.password}
          onChangeText={(value: string) => handleChange('password', value)}
          placeholder="Create a password"
          secureTextEntry
        />
        <Input
          label="Re-type Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-type your password"
          secureTextEntry
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={loading || !hasChanges}
        style={[
          styles.button,
          {
            backgroundColor: loading || !hasChanges ? '#CCC' : '#391D65',
          },
        ]}
      >
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Next'}</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <BackArrowIcon />
        <Text style={{ color: '#391D65' }}>Back</Text>
      </Pressable>
    </SafeAreaWrapper>
  );
};

export default CommunityInfo;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 20,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    marginBottom: 18,
    marginTop: 16,
    color: '#B085EF',
  },
  button: {
    borderWidth: 1,
    borderColor: '#F8F1FF',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 32,
  },
  buttonText: {
    color: '#fff',
  },
  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
});
