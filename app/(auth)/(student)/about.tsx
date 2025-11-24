import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import { CustomCheckbox, Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Define types for form state
interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  location: string;
  socials: string;
  bio: string;
  profileImage?: { uri: string; type: string; name: string } | null;
}

// ✅ Define backend response type
interface UpdateProfileResponse {
  error: boolean;
  message: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    USERNAME?: string;
  };
}

const About = () => {
  const [data, setData] = useState<FormData>({
    firstName: '',
    lastName: 'oipj',
    username: 'hamid',
    password: 'password',
    location: '',
    socials: '',
    bio: '',
  });
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const token = useLocalSearchParams().token as string;
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const router = useRouter();

  useEffect(() => {
    const changes = data.firstName !== '' || data.lastName !== '';

    setHasChanges(changes);
  }, [data.firstName, data.lastName]);

  const handleUpdate = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    console.log(token);
    if (!isChecked) {
      Alert.alert(
        'Terms Required',
        'Please agree to the terms before continuing.',
      );
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('first_name', data.firstName);
      formData.append('last_name', data.lastName);

      const response: AxiosResponse<UpdateProfileResponse> = await axios.put(
        `${apiURL}/v1/api/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.error) {
        Alert.alert(
          'Update Failed',
          JSON.stringify(response.data.message, null, 2),
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
        router.navigate({
          pathname: '/(student)/personal-info',
          params: { token: token },
        });
      }
    } catch (error: any) {
      console.error('Update Error:', error.response || error);
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Something went wrong while updating your profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Header number={1} total={2} />

        <Text style={styles.title}>Tell us about yourself 😄</Text>

        <View style={{ gap: 24 }}>
          <Input
            label="First Name"
            placeholder="First name"
            value={data.firstName}
            onChangeText={(value: string) => handleUpdate('firstName', value)}
          />
          <Input
            label="Last Name"
            placeholder="Last name"
            value={data.lastName}
            onChangeText={(value: string) => handleUpdate('lastName', value)}
          />
        </View>

        <View style={styles.checkboxContainer}>
          <CustomCheckbox
            checked={isChecked}
            onToggle={() => setIsChecked((prev) => !prev)}
          />
          <Text>
            I agree to the <Text style={styles.linkText}>terms</Text> and{' '}
            <Text style={styles.linkText}>privacy policy</Text>.
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={[styles.submitBtn, loading && styles.disabledBtn]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Next</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <BackArrowIcon />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
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
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    marginBottom: 80,
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 8,
    alignContent: 'center',
    marginTop: 80,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#391D65',
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
