import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';           // <-- EXPO IMAGE PICKER
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
// import Video from 'react-native-video';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';

// Unified type for any file/media selected
interface MediaFile {
  uri: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size?: number;
}

const CreateLesson = () => {
  const [title, setTitle] = useState<string>('Introduction');
  const [media, setMedia] = useState<MediaFile | null>(null);
  const [text, setText] = useState<string>('');
  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleID = useLocalSearchParams().moduleId as string;
  const moduleTitle = useLocalSearchParams().moduleTitle;
  const { data: lessonData, isLoading } = useGetLesson(lessonID, moduleID);
  const [loading, setLoading] = useState(false);

  // Normalizes both ImagePicker and DocumentPicker results
const handleMediaSelected = (asset: ImagePicker.ImagePickerAsset | DocumentPickerAsset) => {
  // Helper to safely get file name
  const getFileName = (): string => {
    // expo-image-picker uses `fileName` (iOS/Android)
    if ('fileName' in asset && asset.fileName) return asset.fileName;
    // expo-document-picker uses `name`
    if ('name' in asset && asset.name) return asset.name;
    // Fallback: extract from URI
    return asset.uri.split('/').pop() || 'file';
  };

  // Helper to detect type from mime or fallback
  const getMediaType = (): MediaFile['type'] => {
    const mime = (asset as any).mimeType?.toLowerCase() || '';

    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const unified: MediaFile = {
    uri: asset.uri,
    name: getFileName(),
    type: getMediaType(),
    size: 'fileSize' in asset ? asset.fileSize ?? undefined : 'size' in asset ? asset.size : undefined,
  };

  console.log('Selected media:', unified);
  setMedia(unified);
};

  // Photos & Videos (uses expo-image-picker)
  const pickMediaFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Images + Videos
      allowsEditing: true,
      quality: 1,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
    });

    if (!result.canceled && result.assets?.[0]) {
      handleMediaSelected(result.assets[0]);
    }
  };

  // Documents & Audio (uses expo-document-picker)
  const pickDocumentsOrAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (asset) handleMediaSelected(asset);
  };

  const handleUploadPress = () => {
    Alert.alert('Choose Media Type', 'Select the type of file you want to upload', [
      { text: 'Photos & Videos', onPress: pickMediaFromLibrary },
      { text: 'Documents & Audio', onPress: pickDocumentsOrAudio },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleUpdateForm = async () => {
    if (!media) {
      Alert.alert('Error', 'Please select a media file first');
      return;
    }
    setLoading(true);
    try {
      await uploadLessonMedia(moduleID, lessonID, media);
      setLoading(false);
      Alert.alert('Success', 'Lesson updated!');
    } catch (error: any) {
      console.log('Update Error:', error?.response?.data);
      Alert.alert('Error', 'Could not update lesson');
      setLoading(false);
    }
  };

  const renderMediaPreview = () => {
    if (!media) return null;

    switch (media.type) {
      case 'image':
        return <Image source={{ uri: media.uri }} style={styles.mediaPreview} />;
      case 'video':
        return (
          <View style={styles.videoContainer}>
            {/* <Video
              source={{ uri: media.uri }}
              style={styles.videoPreview}
              paused
              resizeMode="cover"
            /> */}
            <Text style={styles.videoIcon}>Play</Text>
          </View>
        );
      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <Text style={styles.audioIcon}>Music</Text>
            <Text style={styles.audioText}>{media.name}</Text>
          </View>
        );
      default:
        return (
          <View style={styles.documentContainer}>
            <Text style={styles.documentIcon}>Document</Text>
            <Text style={styles.documentName} numberOfLines={2}>
              {media.name}
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavHead text={moduleTitle} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>
            {isLoading ? '...' : lessonData?.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#555', marginTop: 4 }}>
            Course type:{' '}
            <Text style={{ textDecorationLine: 'underline', color: '#000' }}>
              Self-paced
            </Text>
          </Text>
        </View>

        {/* Upload Section */}
        <TouchableOpacity style={styles.uploadSection} onPress={handleUploadPress}>
          <View style={styles.uploadContent}>
            {media ? (
              <>
                {renderMediaPreview()}
                <Text style={styles.mediaName} numberOfLines={1}>
                  {media.name}
                </Text>
                <Text style={styles.changeMediaText}>Tap to change media</Text>
              </>
            ) : (
              <View style={{ gap: 8, alignItems: 'center' }}>
                <Text style={styles.uploadIcon}>Folder</Text>
                <Text style={styles.uploadSubtext}>
                  Videos, audio, images, documents
                </Text>
              </View>
            )}
            <Text style={styles.uploadText}>Upload media</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpdateForm}
          disabled={loading}
          style={{
            marginTop: 25,
            width: '100%',
            height: 45,
            backgroundColor: colors.primary,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.white }}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (your styles stay exactly the same)
  container: { paddingTop: 25, flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20 },
  header: { marginBottom: 30 },
  uploadSection: {
    borderWidth: 2,
    borderColor: colors.purpleShade,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadContent: { alignItems: 'center', width: '100%' },
  uploadIcon: { fontSize: 40 },
  uploadText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 10,
    padding: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 50,
    borderColor: colors.purpleShade,
  },
  uploadSubtext: { fontSize: 12, color: '#666', textAlign: 'center' },
  mediaPreview: { width: 120, height: 120, borderRadius: 8, marginBottom: 10 },
  videoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#000',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreview: { width: '100%', height: '100%', borderRadius: 8 },
  videoIcon: { position: 'absolute', fontSize: 24 },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  audioIcon: { fontSize: 24, marginRight: 10 },
  audioText: { fontSize: 14, color: '#333', flex: 1 },
  documentContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  documentIcon: { fontSize: 32, marginBottom: 5 },
  documentName: { fontSize: 12, color: '#333', textAlign: 'center' },
  mediaName: { fontSize: 14, color: '#333', fontWeight: '500', marginBottom: 5 },
  changeMediaText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
});

export default CreateLesson;