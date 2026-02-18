import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { validateYouTubeUrl, isYouTubeUrl } from '@/utils/youtubeHelpers';

interface RichEditorRef {
  setContentHTML: (html: string) => void;
  getContentHtml: () => Promise<string>;
  focusContent: () => void;
  blurContent: () => void;
}

const CreateLesson = () => {
  const [title, setTitle] = useState<string>('Introduction');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState<string>(''); // Only for initial load and display
  const [editorKey, setEditorKey] = useState(0);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleID = useLocalSearchParams().moduleId as string;
  const moduleTitle = (useLocalSearchParams().moduleTitle as string) || 'Module';
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
      setVideoUrl(lessonData.media || lessonData.url || '');

      const lessonText = lessonData.text || '<p>Start writing your lesson content...</p>';

      // ✅ Set both state and ref for initial content
      setText(lessonText);
      currentContentRef.current = lessonText;

      setEditorKey(prev => prev + 1);
      isInitialLoad.current = false;
    }
  }, [lessonData, isLoading]);

  // ✅ Minimal ref assignment
  const handleEditorRef = useCallback((ref: any) => {
    if (ref && richEditor.current !== ref) {
      (richEditor as any).current = ref;
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

  // Validate YouTube URL
  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    if (url.trim() === '') {
      setUrlError('');
      return;
    }
    const error = validateYouTubeUrl(url);
    setUrlError(error || '');
  };

  const handleUpdateForm = async () => {
    // Validate YouTube URL if provided
    if (videoUrl.trim() !== '') {
      const error = validateYouTubeUrl(videoUrl);
      if (error) {
        Alert.alert('Invalid URL', error);
        return;
      }
    }

    setLoading(true);
    try {
      // ✅ Always get content from ref (most up-to-date)
      const currentContent = getCurrentContent();
      console.log('💾 Saving content from ref:', currentContent.substring(0, 100) + '...');

      // Pass YouTube URL instead of file
      await uploadLessonMedia(lessonID, videoUrl, currentContent);

      // ✅ Update state only after successful save to reflect changes
      setText(currentContent);
      hasUnsavedChangesRef.current = false;

      setLoading(false);
      Alert.alert('Success', 'Lesson updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Update Error:', error);
      setLoading(false);
      
      // Show user-friendly error message
      const errorMessage = error?.message || 'Could not update lesson. Please try again.';
      Alert.alert('Upload Failed', errorMessage, [
        { text: 'OK', style: 'default' },
      ]);
    }
  };

  const renderPreview = () => {
    if (!videoUrl || videoUrl.trim() === '') return null;

    return (
      <View style={styles.previewBox}>
        <View style={styles.videoPlaceholder}>
          <Ionicons name="logo-youtube" size={48} color="#FF0000" />
        </View>
        <Text style={styles.videoName} numberOfLines={2}>
          {isYouTubeUrl(videoUrl) ? 'YouTube Video' : 'Video URL'}
        </Text>
        <Text style={styles.videoUrl} numberOfLines={1}>
          {videoUrl}
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

        <View style={styles.uploadSection}>
          <Ionicons name="logo-youtube" color={colors.primary} size={32} />
          <Text style={styles.sectionTitle}>YouTube Video URL</Text>
          <Text style={styles.sectionSubtitle}>
            Upload your video to YouTube (as Unlisted), then paste the URL here
          </Text>
          
          <TextInput
            style={[styles.urlInput, urlError ? styles.urlInputError : null]}
            value={videoUrl}
            onChangeText={handleUrlChange}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          
          {urlError ? (
            <Text style={styles.errorText}>{urlError}</Text>
          ) : null}
          
          {renderPreview()}
          
          <Text style={styles.helpText}>
            💡 Tip: Set your YouTube video to "Unlisted" so only people with the link can view it
          </Text>
        </View>

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
    borderStyle: 'solid',
    borderRadius: 12,
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  urlInputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  videoName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 200,
  },
  videoUrl: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
    marginTop: 4,
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