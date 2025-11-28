import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // <-- EXPO IMAGE PICKER
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
// import Video from 'react-native-video';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';
import { Ionicons } from '@expo/vector-icons';
import { TextArea } from '@/components/Form';

// Unified type for any file/media selected
interface MediaFile {
  uri: string;
  type: 'video';
  name: string;
  size?: number;
}

const CreateLesson = () => {
  const [title, setTitle] = useState<string>('Introduction');
  const [media, setMedia] = useState<MediaFile | null>(null);
  const [description, setDescription] = useState('');
  const [text, setText] = useState<string>('');
  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleID = useLocalSearchParams().moduleId as string;
  const moduleTitle = useLocalSearchParams().moduleTitle;
  const { data: lessonData, isLoading } = useGetLesson(lessonID, moduleID);
  const [loading, setLoading] = useState(false);
  console.log(lessonData);

  useEffect(() => {
    if (lessonData?.description) {
      setDescription(lessonData.description);
    }
  }, [lessonData]);

  // Normalizes both ImagePicker and DocumentPicker results
  const handleMediaSelected = (
    asset: ImagePicker.ImagePickerAsset | DocumentPickerAsset,
  ) => {
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

      // if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      // if (mime.startsWith('audio/')) return 'audio';
    };

    const unified: MediaFile = {
      uri: asset.uri,
      name: getFileName(),
      type: getMediaType(),
      size:
        'fileSize' in asset
          ? (asset.fileSize ?? undefined)
          : 'size' in asset
            ? asset.size
            : undefined,
    };

    console.log('Selected media:', unified);
    setMedia(unified);
  };

  // Photos & Videos (uses expo-image-picker)
  const pickMediaFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library',
      );
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
    Alert.alert(
      'Choose Media Type',
      'Select the type of file you want to upload',
      [
        // { text: 'Photos & Videos', onPress: pickMediaFromLibrary },
        { text: 'Videos only', onPress: pickDocumentsOrAudio },
        // { text: 'Cancel', style: 'cancel' },
      ],
    );
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

  // Just replace your renderPreview() and related code with this:

  const renderPreview = () => {
    // Use selected media OR the current lesson media from backend
    const currentVideoUrl = media?.uri || lessonData?.media || lessonData?.url;

    if (!currentVideoUrl) return null;

    return (
      <View style={styles.previewBox}>
        {/* Simple black box with big Play icon + video filename */}

        <Text style={styles.videoName} numberOfLines={2}>
          {media?.name ||
            currentVideoUrl.split('/').pop()?.split('?')[0] ||
            'Video'}
        </Text>
      </View>
    );
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
          {/* <Text style={{ fontSize: 14, color: '#555', marginTop: 4 }}>
            Course type:{' '}
            <Text style={{ textDecorationLine: 'underline', color: '#000' }}>
              Self-paced
            </Text>
          </Text> */}
        </View>

        {/* Upload Section */}
        <TouchableOpacity
          style={styles.uploadSection}
          onPress={handleUploadPress}
        >
          <Ionicons name="videocam" color={colors.primary} size={25} />
          <View style={styles.uploadContent}>
            {renderPreview() ? (
              <>
                {renderPreview()}
                <Text style={styles.changeText}>
                  {media ? 'Tap to change video' : 'Tap to replace video'}
                </Text>
              </>
            ) : (
              <View style={{ alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 48 }}>Upload Video</Text>
                <Text style={styles.uploadSubtext}>
                  Tap to add a video lesson
                </Text>
              </View>
            )}

            <Text style={styles.uploadButton}>
              {media || lessonData?.media ? 'Change Video' : 'Upload Video'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* <View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write a detailed description for this lesson..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View> */}

        <TouchableOpacity
          onPress={handleUpdateForm}
          disabled={loading}
          style={{
            marginTop: 50,
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
  previewBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  videoPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#000',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  playIcon: {
    fontSize: 48,
    color: '#fff',
  },
  videoName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 200,
  },
  changeText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  uploadButton: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
    paddingHorizontal: 24,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#B085EF',
    borderRadius: 50,
  },
  container: { paddingTop: 25, flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20, gap: 10 },
  header: { marginBottom: 30 },
  uploadSection: {
    borderWidth: 2,
    borderColor: colors.purpleShade,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  mediaName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  changeMediaText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#391D65',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 150, // You can adjust based on lines
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default CreateLesson;
