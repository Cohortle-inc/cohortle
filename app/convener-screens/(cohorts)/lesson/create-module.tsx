import * as DocumentPicker from 'expo-document-picker';
import { Back } from '@/assets/icons';
import { SafeAreaWrapper } from '@/HOC';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from 'react-native';

type Props = {};

const Index = (props: Props) => {
  const router = useRouter();
  const [video, setVideo] = useState<any>(null); // Store selected file info

  const handlePickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*', // Only allow video files
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setVideo(result.assets[0]); // Store video in state
    }
  };

  // Utility to display file size in MB
  const formatSize = (size: number) => {
    if (!size) return '';
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <SafeAreaWrapper>
      <View style={{ backgroundColor: 'white', marginVertical: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Back />
          </TouchableOpacity>
          <Text
            style={{
              color: '#391D65',
              fontFamily: 'DMSansSemiBold',
              marginLeft: 16,
              flex: 1,
              fontSize: 16,
            }}
          >
            Intro to Branding & Branding Design
          </Text>
        </View>
      </View>
      <View>
        <Text
          style={{
            fontFamily: 'DMSansSemiBold',
            fontSize: 16,
            marginBottom: 16,
          }}
        >
          Create Lesson
        </Text>
        {/* Conditional rendering based on video selection */}
        {!video ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: '#DABCFF',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
            }}
          >
            <Text>Add your course content</Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                borderRadius: 9999,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderColor: '#DABCFF',
                borderWidth: 1,
              }}
              onPress={handlePickVideo}
            >
              <Text>Add lesson</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={{
              borderWidth: 1,
              borderColor: '#DABCFF',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 100,
            }}
          >
            <Text style={{ fontFamily: 'DMSansSemiBold', marginBottom: 8 }}>
              {video.name}
            </Text>
            <Text style={{ marginBottom: 8, color: '#888' }}>
              Size: {formatSize(video.size)}
            </Text>
            <TouchableOpacity
              style={{
                borderRadius: 9999,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderColor: '#DABCFF',
                borderWidth: 1,
              }}
              onPress={handlePickVideo}
            >
              <Text>Replace content</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: '#F8F1FF',
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 32,
            marginTop: 48,
            backgroundColor: '#391D65',
          }}
        >
          <Text style={{ color: 'white' }}>Save as draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            borderWidth: 2,
            borderColor: '#DABCFF',
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 32,
            marginTop: 16,
          }}
        >
          <Text>Publish</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
};

export default Index;

const styles = StyleSheet.create({});
