import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';

interface FormData {
  username: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  server?: string;
}

const SetCredentials = () => {
  const [data, setData] = useState<FormData>({
    username: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { token } = useLocalSearchParams<{ token: string }>();

  // Track changes for enabling the button
  useEffect(() => {
    const hasChanges = data.username.trim() !== '';
    // You can adjust this logic if pre-filled values exist
  }, [data.username]);

  const handleChange = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
    if (errors.server) {
      setErrors((prev) => ({ ...prev, server: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedUsername = data.username.trim();
    if (!trimmedUsername) {
      newErrors.username = 'Username is required';
    } else if (trimmedUsername.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      newErrors.username = 'Only letters, numbers, _, ., - allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!token) {
      Alert.alert('Error', 'Authentication token is missing.');
      return;
    }

    setLoading(true);

    const axiosInstance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    try {
      const response = await axiosInstance.put('/v1/api/profile', {
        username: data.username.trim(),
      });

      if (response.data.error) {
        const msg =
          typeof response.data.message === 'string'
            ? response.data.message
            : 'Failed to update profile.';
        setErrors({ server: msg });
        Alert.alert('Update Failed', msg);
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.push('/student-screens/cohorts'),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Update Error:', error);

      let message = 'Something went wrong. Please try again.';

      if (error.response?.data?.message) {
        if (typeof error.response.data.message === 'string') {
          message = error.response.data.message;
        } else if (error.response.data.message.username) {
          message = error.response.data.message.username;
          setErrors((prev) => ({ ...prev, username: message }));
        }
      }

      setErrors((prev) => ({ ...prev, server: message }));
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const isFormFilled = data.username.trim()

  return (
    <SafeAreaWrapper>
      <Header number={2} total={2} />
      <View style={styles.container}>

        <Text style={styles.title}>What username do you want to use?</Text>

        <Input
          label="Username"
          placeholder="Enter your username"
          value={data.username}
          onChangeText={(value: string) => handleChange('username', value)}
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Server error display */}
        {errors.server && <Text style={styles.serverError}>{errors.server}</Text>}

        {/* Next Button */}
        <Pressable
          onPress={handleSave}
          disabled={!isFormFilled || loading}
          style={[
            styles.nextButton,
            (!isFormFilled || loading) && styles.nextButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </Pressable>

        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackArrowIcon />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaWrapper>
  );
};

export default SetCredentials;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 24,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    color: '#B085EF',
    textAlign: 'center',
    marginVertical: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    color: '#B085EF',
    marginTop: 24,
    marginBottom: 16,
  },
  serverError: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  nextButton: {
    backgroundColor: '#391D65',
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'DMSansMedium',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 20,
  },
  backText: {
    color: '#391D65',
    fontFamily: 'DMSansMedium',
  },
});