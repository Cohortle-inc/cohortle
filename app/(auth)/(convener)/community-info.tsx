import { Alert, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormData {
  name: string;
  url: string;
}

interface FormErrors {
  name?: string;
  url?: string;
  server?: string;
}

const CommunityInfo = () => {
  const [data, setData] = useState<FormData>({ name: '', url: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();
  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

  // Clear field-specific error when user starts typing
  const handleUpdate = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.server) {
      setErrors((prev) => ({ ...prev, server: undefined }));
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!data.name.trim()) {
      newErrors.name = 'Community name is required';
    } else if (data.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
    }

    if (!data.url.trim()) {
      newErrors.url = 'Community URL is required';
    } else if (data.url.trim().length < 4) {
      newErrors.url = 'URL must be at least 4 characters long';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.url.trim())) {
      newErrors.url = 'URL can only contain letters, numbers, underscores, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCohortCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({}); // Clear any previous server errors

    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Authentication Error', 'No auth token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${apiURL}/v1/api/cohorts`,
        {
          name: data.name.trim(),
          url: data.url.trim(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Cohort created:', response.data);

      // Navigate to next screen with cohort_id
      router.navigate({
        pathname: '/(auth)/(convener)/more-info',
        params: { cohort_id: response.data.cohort_id },
      });
    } catch (error: any) {
      console.error('Error creating cohort:', error.response?.data || error);

      let errorMessage = 'Failed to create community. Please try again.';

      if (error.response?.data?.message) {
        // Handle specific backend errors (e.g., URL already taken)
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (error.response.data.message?.url) {
          errorMessage = error.response.data.message.url;
          setErrors((prev) => ({ ...prev, url: errorMessage }));
        } else if (error.response.data.message?.name) {
          errorMessage = error.response.data.message.name;
          setErrors((prev) => ({ ...prev, name: errorMessage }));
        }
      }

      setErrors((prev) => ({ ...prev, server: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = data.name.trim().length > 0 && data.url.trim().length > 0;

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Header number={2} total={4} />

        <View style={styles.headerText}>
          <Text style={styles.title}>
            Now let’s create your community.
          </Text>
          <Text style={styles.subtitle}>
            Don’t worry - you can always change this information later
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Name your cohort"
            placeholder="Model Children Coding Academy"
            value={data.name}
            onChangeText={(value: string) => handleUpdate('name', value)}
            error={errors.name}
          />

          <View style={styles.urlSection}>
            <Input
              label="Community URL"
              placeholder="modelacademy"
              value={data.url}
              onChangeText={(value: string) => handleUpdate('url', value)}
              error={errors.url}
            />
            <Text style={styles.urlHint}>
              We will add a code to it e.g. {data.url || 'modelacademy'}-abd
            </Text>
          </View>

          {/* Server-wide error message */}
          {errors.server && (
            <Text style={styles.serverError}>{errors.server}</Text>
          )}
        </View>

        {/* Next Button */}
        <Pressable
          onPress={handleCohortCreate}
          disabled={!isFormValid || loading}
          style={[
            styles.nextButton,
            (!isFormValid || loading) && styles.nextButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </Pressable>

        {/* Back Button (Uncomment if needed) */}
        {/* <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <BackArrowIcon />
          <Text style={styles.backText}>Back</Text>
        </Pressable> */}
      </View>
    </SafeAreaWrapper>
  );
};

export default CommunityInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  headerText: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    color: '#B085EF',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'DMSansRegular',
    color: '#B085EF',
  },
  form: {
    gap: 24,
    marginBottom: 20,
  },
  urlSection: {
    gap: 8,
  },
  urlHint: {
    fontSize: 12,
    color: '#999',
    paddingLeft: 4,
  },
  serverError: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  nextButton: {
    backgroundColor: '#391D65',
    paddingVertical: 14,
    borderRadius: 32,
    alignItems: 'center',
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
    paddingVertical: 14,
    marginTop: 20,
  },
  backText: {
    color: '#391D65',
    fontFamily: 'DMSansMedium',
  },
});