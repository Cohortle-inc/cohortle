import { Alert, Pressable, StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { useRouter } from 'expo-router';
import { Back } from '@/assets/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePostCommunity, CommunityType } from '@/api/communities/postCommunity';

// Rename local state interface to avoid confusion with API types or global FormData
interface CommunityFormState {
  name: string;
  prefix: string;
  description: string;
}

interface FormErrors {
  name?: string;
  prefix?: string;
  description?: string;
  server?: string;
}

const CommunityInfo = () => {
  const [data, setData] = useState<CommunityFormState>({
    name: '',
    prefix: '',
    description: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();

  // Use the mutation hook
  const { mutateAsync, isPending } = usePostCommunity();

  // Clear field-specific error when user starts typing
  const handleUpdate = (field: keyof CommunityFormState, value: string) => {
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

    if (!data.prefix.trim()) {
      newErrors.prefix = 'Community prefix is required';
    } else if (data.prefix.trim().length < 4) {
      newErrors.prefix = 'Prefix must be at least 4 characters long';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.prefix.trim())) {
      newErrors.prefix = 'Prefix can only contain letters, numbers, underscores, and hyphens';
    }

    // Description validation
    if (!data.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCommunityCreate = async () => {
    if (!validateForm()) return;

    setErrors({}); // Clear any previous server errors

    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Authentication Error', 'No auth token found. Please log in again.');
        return;
      }

      // Prepare payload matching CommunityType
      const payload: CommunityType = {
        name: data.name.trim(),
        codePrefix: data.prefix.trim(),
        description: data.description.trim(),
        type: 'course', // Defaulting to public
      };

      const response = await mutateAsync(payload);

      console.log('Community created:', response);

      // Navigate to next screen with community_id
      // Assuming response contains the created community object which has an id
      router.navigate({
        pathname: '/(auth)/(convener)/more-info',
        params: { cohort_id: response.id || response.data?.id || response.community_id },
      });


    } catch (error: any) {
      console.error('Error creating community:', error);

      let errorMessage = 'Failed to create community. Please try again.';

      // Attempt to parse backend validation errors
      const responseData = error.message ? null : error.response?.data;

      if (responseData?.message) {
        if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (responseData.message?.codePrefix) {
          setErrors((prev) => ({ ...prev, prefix: responseData.message.codePrefix }));
          errorMessage = 'Please fix the errors above.';
        } else if (responseData.message?.name) {
          setErrors((prev) => ({ ...prev, name: responseData.message.name }));
          errorMessage = 'Please fix the errors above.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors((prev) => ({ ...prev, server: errorMessage }));
    }
  };

  const isFormValid =
    data.name.trim().length > 0 &&
    data.prefix.trim().length > 0 &&
    data.description.trim().length > 0;

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Header number={3} total={4} />

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
            label="Name your community"
            placeholder="Model Children Coding Academy"
            value={data.name}
            onChangeText={(value: string) => handleUpdate('name', value)}
            error={errors.name}
          />

          <View style={styles.prefixSection}>
            <Input
              label="Community prefix"
              placeholder="modelacademy"
              value={data.prefix}
              onChangeText={(value: string) => handleUpdate('prefix', value)}
              error={errors.prefix}
            />
            <Text style={styles.prefixHint}>
              We will add a code to it e.g. {data.prefix || 'modelacademy'}-abd
            </Text>
          </View>

          <Input
            label="Description"
            placeholder="Tell us about your community..."
            value={data.description}
            onChangeText={(value: string) => handleUpdate('description', value)}
            error={errors.description}
            multiline
            numberOfLines={3}
          />

          {/* Server-wide error message */}
          {errors.server && (
            <Text style={styles.serverError}>{errors.server}</Text>
          )}
        </View>

        {/* Next Button */}
        <Pressable
          onPress={handleCommunityCreate}
          disabled={!isFormValid || isPending}
          style={[
            styles.nextButton,
            (!isFormValid || isPending) && styles.nextButtonDisabled,
          ]}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </Pressable>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            gap: 8,
          }}
          onPress={() => router.back()}
        >
          <Back />
          <Text style={{ color: '#391D65', fontSize: 14, fontFamily: 'DMSansMedium' }}>Back</Text>
        </TouchableOpacity>
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
  prefixSection: {
    gap: 8,
  },
  prefixHint: {
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
});