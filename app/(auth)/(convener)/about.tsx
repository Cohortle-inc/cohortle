import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import { CustomCheckbox, Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon, Back } from '@/assets/icons';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Define types for form state
interface FormData {
  username: string;
  password: string;
  location: string;
  socials: string;
  bio: string;
  profileImage?: { uri: string; type: string; name: string } | null;
}

// ✅ Define errors interface
interface FormErrors {
  terms?: string;
}

// ✅ Define backend response type
interface UpdateProfileResponse {
  error: boolean;
  message: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    USERNAME?: string;
    TOKEN: string;
  };
}

const About = () => {
  const [data, setData] = useState<FormData>({
    username: '',
    password: '',
    location: '',
    socials: '',
    bio: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { token, firstName, lastName } = useLocalSearchParams<{
    token: string;
    firstName?: string;
    lastName?: string;
  }>();
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const router = useRouter();

  // Track if any relevant field has changed
  useEffect(() => {
    const changes = isChecked;
    setHasChanges(changes);
  }, [isChecked]);

  const handleUpdate = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isChecked) {
      newErrors.terms = 'You must agree to the terms and privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!firstName || !lastName) {
      Alert.alert('Error', 'Name information is missing. Please start the signup process again.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('password', data.password); // still sent if filled, but optional

      const response = await axios.put(`${apiURL}/v1/api/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.error) {
        // Backend validation errors (e.g., field-specific messages)
        const backendMsg = response.data.message;
        let errorText = 'Please correct the following:\n';
        if (backendMsg.FIRSTNAME) errorText += `• First name: ${backendMsg.FIRSTNAME}\n`;
        if (backendMsg.LASTNAME) errorText += `• Last name: ${backendMsg.LASTNAME}\n`;
        // Add more fields if needed
        Alert.alert('Update Failed', errorText.trim());
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
        await AsyncStorage.setItem('authToken', token);
        router.navigate({
          pathname: '/(auth)/(convener)/community-info',
          params: { token: token },
        });
      }
    } catch (error: any) {
      console.error('Update Error:', error.response || error);
      const msg =
        error?.response?.data?.message ||
        'Something went wrong while updating your profile.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Header number={2} total={3} />
        <Text style={styles.title}>Tell us about yourself</Text>
        <View style={{ gap: 24 }}>
          {/* Name fields removed - now passed from previous screen */}
          <View style={styles.nameDisplay}>
            <Text style={styles.nameLabel}>Name:</Text>
            <Text style={styles.nameValue}>{firstName} {lastName}</Text>
          </View>
          {/* Uncomment if password is required later
          <Input
            label="Password"
            value={data.password}
            onChangeText={(value: string) => handleUpdate('password', value)}
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
          */}
        </View>

        <View style={styles.checkboxContainer}>
          <CustomCheckbox
            checked={isChecked}
            onToggle={() => {
              setIsChecked((prev) => !prev);
              if (errors.terms) {
                setErrors((prev) => ({ ...prev, terms: undefined }));
              }
            }}
          />
          <View style={{ flex: 1 }}>
            <Text>
              I agree to the <Text style={styles.linkText}>terms</Text> and{' '}
              <Text style={styles.linkText}>privacy policy</Text>.
            </Text>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={loading || !isChecked}
          style={[styles.submitBtn, (loading || !hasChanges) && styles.disabledBtn]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Next</Text>
          )}
        </Pressable>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Back />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'DMSansBold',
    color: '#1F1F1F',
    marginBottom: 80,
  },
  nameDisplay: {
    padding: 16,
    backgroundColor: '#F8F1FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5D9F2',
  },
  nameLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'DMSansMedium',
  },
  nameValue: {
    fontSize: 16,
    color: '#391D65',
    fontFamily: 'DMSansBold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 80,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#391D65',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  submitBtn: {
    borderWidth: 1,
    borderColor: '#F8F1FF',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 32,
    marginTop: 48,
    backgroundColor: '#391D65',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
  },
  backBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  backText: {
    color: '#391D65',
  },
});