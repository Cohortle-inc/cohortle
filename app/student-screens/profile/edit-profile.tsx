import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import React, { useState } from 'react';
import { Back, Camera } from '@/assets/icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DropdownInput, Input, TextArea } from '@/components/Form';
import * as ImagePicker from 'expo-image-picker';

type Props = {};

const EditProfile = (props: Props) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: '#ECDCFF',
            paddingHorizontal: 16,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Back />
          </Pressable>
          <Text>Edit Profile</Text>
        </View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 26,
          }}
        >
          {/* Container for the image and camera badge */}
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 26,
            }}
          >
            <View style={{ position: 'relative' }}>
              {/* Profile image - now shows either the selected image or the placeholder */}
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

              {/* Camera badge */}
              <Pressable
                onPress={pickImage}
                style={{
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
                }}
              >
                <Camera />
              </Pressable>
            </View>
          </View>
        </View>
        <View style={{ gap: 8, paddingHorizontal: 16, marginTop: 24 }}>
          <Input label="Full Name" placeholder="Full name" />
          <TextArea label="Bio" />

          <Input label="X URL" placeholder="X URL" />

          <Input label="Facebook URL" placeholder="Facebook URL" />

          <Input label="Instagram URL" placeholder="Instagram URL" />

          <Input label="LinkedIn URL" placeholder="LinkedIn URL" />
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            marginTop: 24,
            flexDirection: 'row',
            gap: 16,
          }}
        >
          <Pressable
            style={{
              backgroundColor: 'white',
              padding: 6,
              borderRadius: 500,
              flex: 1,
              borderWidth: 1,
              borderColor: '#F8F1FF',
            }}
          >
            <Text
              style={{
                color: '#391D65',
                textAlign: 'center',
              }}
            >
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={{
              backgroundColor: '#391D65',
              padding: 6,
              borderRadius: 500,
              flex: 1,
            }}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
              }}
            >
              Save changes
            </Text>
          </Pressable>
        </View>
        <Text style={{ marginTop: 24, textAlign: 'center', color: '#1F1F1F' }}>
          You have unsaved changes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  profileImage: {
    height: 152,
    width: 152,
    backgroundColor: '#F2750D',
    borderRadius: 8,
  },
  contentContainer: {
    padding: 16,
  },
});
