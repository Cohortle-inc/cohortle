import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

interface MediaFile {
  uri: string;
  type: 'video';
  name: string;
  size?: number;
}

interface RichEditorRef {
  setContentHTML: (html: string) => void;
  getContentHtml: () => Promise<string>;
  focusContent: () => void;
  blurContent: () => void;
}

const CreateLesson = () => {
  const [title, setTitle] = useState<string>('Introduction');
  const [media, setMedia] = useState<MediaFile | null>(null);
  const [description, setDescription] = useState('');
  const [text, setText] = useState<string>(''); // Only for initial load and display
  const [editorKey, setEditorKey] = useState(0);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleID = useLocalSearchParams().moduleId as string;
  const moduleTitle = useLocalSearchParams().moduleTitle;
  const { data: lessonData, isLoading } = useGetLesson(lessonID);
  console.log(lessonData)

  const richEditor = useRef<RichEditorRef>(null);

  // ✅ Store content in ref to prevent re-renders
  const currentContentRef = useRef('');
  const hasUnsavedChangesRef = useRef(false);
  const isInitialLoad = useRef(true);

  // ✅ Safe editor reference
  const getEditorRef = useCallback(() => {
    return isEditorReady ? richEditor.current : null;
  }, [isEditorReady]);

  useEffect(() => {
    if (lessonData && !isLoading && isInitialLoad.current) {
      console.log('📥 Loading lesson data into editor');

      setDescription(lessonData.description || '');

      const lessonText = lessonData.text || '<p>Start writing your lesson content...</p>';

      // ✅ Set both state and ref for initial content
      setText(lessonText);
      currentContentRef.current = lessonText;

      setEditorKey(prev => prev + 1);
      isInitialLoad.current = false;
    }
  }, [lessonData, isLoading]);

  // ✅ Minimal ref assignment
  const handleEditorRef = useCallback((ref: RichEditorRef | null) => {
    richEditor.current = ref;
    if (ref) {
      console.log('✅ Editor ref assigned');
    }
  }, []);

  // ✅ FIX: Store content in ref ONLY - no state updates during typing
  const handleContentChange = useCallback((html: string) => {
    // ✅ Only update the ref - this doesn't cause re-renders
    currentContentRef.current = html;
    hasUnsavedChangesRef.current = true;

    // ✅ Optional: Log changes without affecting state
    console.log('📝 Content changed (ref only):', html.substring(0, 50) + '...');
  }, []);

  // ✅ Editor initialization
  const handleEditorInitialized = useCallback(() => {
    console.log('✅ Editor initialized');
    setIsEditorReady(true);
  }, []);

  // ✅ Get current content for saving (always from ref)
  const getCurrentContent = useCallback((): string => {
    return currentContentRef.current || text;
  }, [text]);

  // Media handling functions...
  const handleMediaSelected = (
    asset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
  ) => {
    const getFileName = (): string => {
      if ('fileName' in asset && asset.fileName) return asset.fileName;
      if ('name' in asset && asset.name) return asset.name;
      return asset.uri.split('/').pop() || 'file';
    };

    const getMediaType = (): MediaFile['type'] => {
      const mime = (asset as any).mimeType?.toLowerCase() || '';
      if (mime.startsWith('video/')) return 'video';
      return 'video';
    };

    const unified: MediaFile = {
      uri: asset.uri,
      name: getFileName(),
      type: getMediaType(),
      size: 'fileSize' in asset ? (asset.fileSize ?? undefined) : 'size' in asset ? asset.size : undefined,
    };

    setMedia(unified);
  };

  const pickMediaFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false, // Disabled - can crash on large videos
        quality: 0.8, // Reduced to prevent memory issues
        videoMaxDuration: 3600, // 1 hour max
      });

      if (!result.canceled && result.assets?.[0]) {
        handleMediaSelected(result.assets[0]);
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to select video. Please try again or use a smaller file.');
    }
  };

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
        { text: 'Video from Gallery', onPress: pickMediaFromLibrary },
        { text: 'Video from Files', onPress: pickDocumentsOrAudio },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleUpdateForm = async () => {
    setLoading(true);
    try {
      // ✅ Always get content from ref (most up-to-date)
      const currentContent = getCurrentContent();
      console.log('💾 Saving content from ref:', currentContent.substring(0, 100) + '...');

      await uploadLessonMedia(lessonID, media, currentContent);

      // ✅ Update state only after successful save to reflect changes
      setText(currentContent);
      hasUnsavedChangesRef.current = false;

      setLoading(false);
      Alert.alert('Success', 'Lesson updated!');
      router.back()
    } catch (error: any) {
      console.log('Update Error:', error?.response?.data);
      Alert.alert('Error', 'Could not update lesson');
      setLoading(false);
    }
  };

  const renderPreview = () => {
    const currentVideoUrl = media?.uri || lessonData?.media || lessonData?.url;

    if (!currentVideoUrl) return null;

    return (
      <View style={styles.previewBox}>
        <View style={styles.videoPlaceholder}>
          <Ionicons name="play-circle" size={48} color="#fff" />
        </View>
        <Text style={styles.videoName} numberOfLines={2}>
          {media?.name || currentVideoUrl.split('/').pop()?.split('?')[0] || 'Video'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavHead text={moduleTitle} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>
            {isLoading ? '...' : lessonData?.name}
          </Text>
        </View>

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
                <Text style={styles.uploadSubtext}>
                  Tap to add a video lesson
                </Text>
              </View>
            )}

            <Text style={styles.uploadButton}>
              {media || lessonData?.media ? 'Change Video' : 'Select Video'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ✅ Fixed Rich Text Editor - No re-renders during typing */}
        <View style={styles.richEditorContainer}>
          <Text style={styles.editorLabel}>Lesson Content</Text>

          {isEditorReady && (
            <RichToolbar
              getEditor={getEditorRef}
              selectedIconTint={colors.primary}
              iconTint={'#000'}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.insertBulletsList,
                actions.insertOrderedList,
                actions.insertLink,
                actions.setStrikethrough,
                actions.checkboxList,
                actions.undo,
                actions.redo,
              ]}
              style={styles.toolbar}
            />
          )}

          <View style={styles.editorWrapper}>
            <RichEditor
              key={editorKey}
              ref={handleEditorRef}
              initialContentHTML={text} // Only used for initial load
              onChange={handleContentChange} // Only updates ref, not state
              editorInitializedCallback={handleEditorInitialized}
              placeholder="Start writing your lesson content..."
              style={styles.richEditor}
              useContainer={true}
              initialHeight={250}
              autoCapitalize="none"
              allowFileAccess={true}
              automaticallyAdjustContentInsets={false}
              initialFocus={false}
              disabled={false}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleUpdateForm}
          disabled={loading}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Lesson'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 25, flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20, gap: 20 },
  header: { marginBottom: 20 },
  uploadSection: {
    borderWidth: 2,
    borderColor: colors.purpleShade,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  uploadContent: { alignItems: 'center', width: '100%' },
  uploadSubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  uploadButton: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.purpleShade,
    borderRadius: 25,
  },
  previewBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  videoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
  richEditorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
  },
  editorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toolbar: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editorWrapper: {
    minHeight: 250,
  },
  richEditor: {
    flex: 1,
    minHeight: 250,
    padding: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 30,
    width: '100%',
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateLesson;