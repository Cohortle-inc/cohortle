import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Back, Camera } from '@/assets/icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input, TextArea } from '@/components/Form';
import * as ImagePicker from 'expo-image-picker';
import { useProfile, useUpdateProfile } from '@/hooks/api/useProfileHook';

type Props = {};

const EditProfile = (props: Props) => {
  // Initialize state with profile data
  const { data: profileData, isLoading: isProfileLoading } = useProfile();
  // console.log(profileData.profile_image);
  const updateProfileMutation = useUpdateProfile();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    location: '',
    socials: '',
    bio: '',
  });
  // const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    location: '',
    socials: '',
    bio: '',
    profileImage: null as string | null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Load profile data when available
  useEffect(() => {
    if (profileData) {
      const newFormData = {
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        location: profileData.location || '',
        socials: profileData.socials || '',
        bio: profileData.bio || '',
      };

      setFormData(newFormData);
      setOriginalData({
        ...newFormData,
        profileImage: profileData.profile_image || null,
      });
      // setProfileImage(profileData.profile_image || null);
    }
  }, [profileData]);

  // Detect changes
  useEffect(() => {
    const hasFormChanges =
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.location !== originalData.location ||
      formData.socials !== originalData.socials ||
      formData.bio !== originalData.bio
      // profileImage !== originalData.profileImage;

    setHasChanges(hasFormChanges);
  }, [formData, originalData]);

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      location: formData.location.trim(),
      socials: formData.socials.trim(),
      bio: formData.bio.trim()
      // profile_image: profileImage || undefined,
    };

    updateProfileMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Profile updated successfully!', [
            {
              text: 'OK',
              onPress: () => {
                setIsSaving(false);
                router.back();
              },
            },
          ]);
        },
        onError: (error: any) => {
          setIsSaving(false);
          Alert.alert('Error', error.message || 'Failed to update profile');
        },
      },
    );
  };

  const pickImage = useCallback(async () => {
    try {
      setIsPickingImage(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to update your profile picture.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // if (!result.canceled && result.assets.length > 0) {
      //   setProfileImage(result.assets[0].uri);
      // }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  const handleCancel = () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Loading state
  if (isProfileLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color="#391D65" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleCancel}
            disabled={isSaving || isPickingImage}
          >
            <Back />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Profile Image */}
        {/* <View style={styles.imageContainer}>
          <View style={{ position: 'relative' }}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileImage} />
            )}

            <Pressable
              onPress={pickImage}
              style={[
                styles.cameraBadge,
                (isSaving || isPickingImage) && styles.cameraBadgeDisabled,
              ]}
              disabled={isSaving || isPickingImage}
            >
              {isPickingImage ? (
                <ActivityIndicator size="small" color="#391D65" />
              ) : (
                <Camera />
              )}
            </Pressable>
          </View>
        </View> */}

        {/* Form */}
        <View style={styles.formContainer}>
          <Input
            value={formData.firstName}
            onChangeText={(value: string) =>
              updateFormField('firstName', value)
            }
            label="First Name"
            placeholder="Enter your first name"
            editable={!isSaving}
          />

          <Input
            value={formData.lastName}
            onChangeText={(value: string) => updateFormField('lastName', value)}
            label="Last Name"
            placeholder="Enter your last name"
            editable={!isSaving}
          />

          <TextArea
            label="Bio"
            value={formData.bio}
            onChangeText={(value: string) => updateFormField('bio', value)}
            placeholder="Tell us about yourself"
            editable={!isSaving}
            maxLength={500}
          />

          <Input
            value={formData.location}
            onChangeText={(value: string) => updateFormField('location', value)}
            label="Location"
            placeholder="Enter your location"
            editable={!isSaving}
          />

          <Input
            value={formData.socials}
            onChangeText={(value: string) => updateFormField('socials', value)}
            label="Social Link"
            placeholder="Enter your social media link"
            editable={!isSaving}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleCancel}
            style={[
              styles.cancelBtn,
              (isSaving || isPickingImage) && styles.buttonDisabled,
            ]}
            disabled={isSaving || isPickingImage}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={isSaving || isPickingImage || !hasChanges}
            style={[
              styles.saveBtn,
              (isSaving || isPickingImage || !hasChanges) &&
                styles.saveBtnDisabled,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </Pressable>
        </View>

        {/* Changes Indicator */}
        {hasChanges && !isSaving && !isPickingImage && (
          <Text style={styles.changesText}>You have unsaved changes</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;

// Updated styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#ECDCFF',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F1F1F',
    flex: 1,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },
  profileImage: {
    height: 152,
    width: 152,
    backgroundColor: '#F2750D',
    borderRadius: 76, // Circular image
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    height: 32,
    width: 32,
    backgroundColor: '#ECDCFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraBadgeDisabled: {
    opacity: 0.6,
  },
  formContainer: {
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 32,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 20,
  },
  cancelBtn: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    flex: 1,
    borderWidth: 1,
    borderColor: '#F8F1FF',
    alignItems: 'center',
  },
  cancelText: {
    color: '#391D65',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#391D65',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  changesText: {
    marginTop: 24,
    marginHorizontal: 16,
    textAlign: 'center',
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
});
