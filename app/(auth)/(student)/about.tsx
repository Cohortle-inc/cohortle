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
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

interface FormData {
  // firstName and lastName removed - now passed as params
}

interface FormErrors {
  terms?: string;
  server?: string;
}

const About = () => {
  const [data, setData] = useState<FormData>({});
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { token, firstName, lastName } = useLocalSearchParams<{ 
    token: string;
    firstName?: string;
    lastName?: string;
  }>();
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;
  const router = useRouter();

  // Clear field errors on input
  const handleUpdate = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors.server) {
      setErrors((prev) => ({ ...prev, server: undefined }));
    }
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
    if (!validateForm()) return;

    if (!token) {
      Alert.alert('Error', 'Authentication token is missing.');
      return;
    }

    if (!firstName || !lastName) {
      Alert.alert('Error', 'Name information is missing. Please start the signup process again.');
      return;
    }

    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());

      const response = await axios.put(
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
        // Handle backend validation errors
        const msg = response.data.message;
        let errorText = 'Please correct the following:\n';
        if (msg.FIRSTNAME) errorText += `• First name: ${msg.FIRSTNAME}\n`;
        if (msg.LASTNAME) errorText += `• Last name: ${msg.LASTNAME}\n`;

        setErrors({ server: errorText.trim() });
        Alert.alert('Update Failed', errorText.trim());
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () =>
              router.navigate({
                pathname: '/(student)/personal-info',
                params: { token },
              }),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Update Error:', error.response || error);

      const message =
        error?.response?.data?.message ||
        'Something went wrong while updating your profile.';

      setErrors({ server: typeof message === 'string' ? message : 'Update failed.' });
      Alert.alert('Error', typeof message === 'string' ? message : 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = isChecked;

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Header number={1} total={2} />

        <Text style={styles.title}>Tell us about yourself 😄</Text>

        <View style={styles.form}>
          {/* Name fields removed - now passed from previous screen */}
          <View style={styles.nameDisplay}>
            <Text style={styles.nameLabel}>Name:</Text>
            <Text style={styles.nameValue}>{firstName} {lastName}</Text>
          </View>
        </View>

        {/* Terms Checkbox with Error */}
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

        {/* Server Error */}
        {errors.server && <Text style={styles.serverError}>{errors.server}</Text>}

        {/* Next Button */}
        <Pressable
          onPress={handleSave}
          disabled={!isFormValid || loading}
          style={[
            styles.submitBtn,
            (!isFormValid || loading) && styles.disabledBtn,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Next</Text>
          )}
        </Pressable>

        {/* Back Button */}
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
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    marginBottom: 60,
    color: '#391D65',
  },
  form: {
    gap: 24,
    marginTop: 20,
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
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 60,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#391D65',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 6,
  },
  serverError: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  submitBtn: {
    backgroundColor: '#391D65',
    borderWidth: 1,
    borderColor: '#F8F1FF',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 32,
    marginTop: 48,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'DMSansMedium',
  },
  backBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  backText: {
    color: '#391D65',
    fontFamily: 'DMSansMedium',
  },
});