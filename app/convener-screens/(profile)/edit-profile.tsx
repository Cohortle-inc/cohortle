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
import React, { useState, useEffect } from 'react';
import { Back, Camera } from '@/assets/icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input, TextArea } from '@/components/Form';
import * as ImagePicker from 'expo-image-picker';
import { useProfile, useUpdateProfile } from '@/hooks/api/useProfileHook';

type Props = {};

const EditProfile = (props: Props) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [socials, setSocials] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const updateProfileMutation = useUpdateProfile();
  const router = useRouter();
  const { data: profileData } = useProfile();

  useEffect(() => {
    const changes =
      firstName !== '' ||
      lastName !== '' ||
      location !== '' ||
      socials !== '' ||
      bio !== '' ||
      profileImage !== null;

    setHasChanges(changes);
  }, [firstName, lastName, location, socials, bio, profileImage]);

  const handleSave = async () => {
    updateProfileMutation.mutate(
      { data: { first_name: firstName, location, socials } },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Profile updated!');
        },
        onError: (error) => {
          Alert.alert('Error', error.message);
        },
      },
    );
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Reduced quality for faster uploads
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', onPress: () => {} },
        ],
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleCancel} disabled={isSaving}>
            <Back />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <View style={{ position: 'relative' }}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={[
                  styles.profileImage,
                  { backgroundColor: 'transparent' },
                ]}
              />
            ) : (
              <View style={styles.profileImage} />
            )}

            <Pressable
              onPress={pickImage}
              style={styles.cameraBadge}
              disabled={isSaving}
            >
              <Camera />
            </Pressable>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Input
            value={firstName}
            onChangeText={setFirstName}
            label="First Name"
            placeholder={profileData.first_name}
            editable={!isSaving}
          />
          <Input
            value={lastName}
            onChangeText={setLastName}
            label="Last Name"
            placeholder={profileData.last_name}
            editable={!isSaving}
          />
          <TextArea
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            editable={!isSaving}
          />
          <Input
            value={location}
            onChangeText={setLocation}
            label="Location"
            placeholder={profileData.location || 'Enter your location'}
            editable={!isSaving}
          />
          <Input
            value={socials}
            onChangeText={setSocials}
            label="Social Link"
            placeholder={profileData.socials || 'Enter your social link'}
            editable={!isSaving}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleCancel}
            style={[styles.cancelBtn, isSaving && styles.buttonDisabled]}
            disabled={isSaving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            style={[
              styles.saveBtn,
              (isSaving || !hasChanges) && styles.saveBtnDisabled,
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
        {hasChanges && !isSaving && (
          <Text style={styles.changesText}>You have unsaved changes.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;

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
    borderRadius: 8,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    height: 32,
    width: 32,
    backgroundColor: '#ECDCFF',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  formContainer: {
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    flexDirection: 'row',
    gap: 16,
  },
  cancelBtn: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 500,
    flex: 1,
    borderWidth: 1,
    borderColor: '#F8F1FF',
    alignItems: 'center',
  },
  cancelText: {
    color: '#391D65',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#391D65',
    padding: 16,
    borderRadius: 500,
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
  },
  changesText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#1F1F1F',
    fontSize: 14,
  },
});
