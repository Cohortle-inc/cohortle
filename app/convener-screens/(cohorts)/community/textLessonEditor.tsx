import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

interface RichEditorRef {
  setContentHTML: (html: string) => void;
  getContentHtml: () => Promise<string>;
  focusContent: () => void;
  blurContent: () => void;
}

const TextLessonEditor = () => {
  const [text, setText] = useState<string>('');
  const [editorKey, setEditorKey] = useState(0);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleTitle = (useLocalSearchParams().moduleTitle as string) || 'Module';
  const { data: lessonData, isLoading } = useGetLesson(lessonID);

  const richEditor = useRef<RichEditorRef>(null);
  const currentContentRef = useRef('');
  const hasUnsavedChangesRef = useRef(false);
  const isInitialLoad = useRef(true);

  const getEditorRef = useCallback(() => {
    return isEditorReady ? richEditor.current : null;
  }, [isEditorReady]);

  useEffect(() => {
    if (lessonData && !isLoading && isInitialLoad.current) {
      console.log('📥 Loading text lesson data into editor');

      const lessonText = lessonData.text || '<p>Start writing your text lesson content...</p>';

      setText(lessonText);
      currentContentRef.current = lessonText;

      setEditorKey(prev => prev + 1);
      isInitialLoad.current = false;
    }
  }, [lessonData, isLoading]);

  const handleEditorRef = useCallback((ref: any) => {
    if (ref && richEditor.current !== ref) {
      (richEditor as any).current = ref;
      console.log('✅ Editor ref assigned');
    }
  }, []);

  const handleContentChange = useCallback((html: string) => {
    currentContentRef.current = html;
    hasUnsavedChangesRef.current = true;
    console.log('📝 Content changed (ref only):', html.substring(0, 50) + '...');
  }, []);

  const handleEditorInitialized = useCallback(() => {
    console.log('✅ Editor initialized');
    setIsEditorReady(true);
  }, []);

  const getCurrentContent = useCallback((): string => {
    return currentContentRef.current || text;
  }, [text]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentContent = getCurrentContent();
      console.log('💾 Saving text lesson content:', currentContent.substring(0, 100) + '...');

      // For text lessons, we don't need a media URL, just save the text content
      await uploadLessonMedia(lessonID, '', currentContent);

      setText(currentContent);
      hasUnsavedChangesRef.current = false;

      setLoading(false);
      Alert.alert('Success', 'Text lesson saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Save Error:', error);
      setLoading(false);
      
      const errorMessage = error?.message || 'Could not save text lesson. Please try again.';
      Alert.alert('Save Failed', errorMessage, [
        { text: 'OK', style: 'default' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavHead text={moduleTitle} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="document-text-outline" size={32} color={colors.primary} />
          <Text style={styles.headerTitle}>
            {isLoading ? '...' : lessonData?.name || 'Text Lesson'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Create rich text content with formatting
          </Text>
        </View>

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
              initialContentHTML={text}
              onChange={handleContentChange}
              editorInitializedCallback={handleEditorInitialized}
              placeholder="Start writing your text lesson content..."
              style={styles.richEditor}
              useContainer={true}
              initialHeight={400}
              autoCapitalize="none"
              allowFileAccess={true}
              automaticallyAdjustContentInsets={false}
              initialFocus={false}
              disabled={false}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Text Lesson'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 25, flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20, gap: 20 },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  richEditorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    minHeight: 400,
  },
  richEditor: {
    flex: 1,
    minHeight: 400,
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

export default TextLessonEditor;
