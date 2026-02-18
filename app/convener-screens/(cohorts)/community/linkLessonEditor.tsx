import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';
import { Ionicons } from '@expo/vector-icons';

interface LinkData {
  url: string;
  description: string;
  thumbnailUrl?: string;
}

const LinkLessonEditor = () => {
  const [url, setUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleTitle = (useLocalSearchParams().moduleTitle as string) || 'Module';
  const { data: lessonData, isLoading } = useGetLesson(lessonID);

  useEffect(() => {
    if (lessonData && !isLoading) {
      console.log('📥 Loading link lesson data');
      
      // Try to parse existing link data from description field
      if (lessonData.description) {
        try {
          const linkData: LinkData = JSON.parse(lessonData.description);
          setUrl(linkData.url || '');
          setDescription(linkData.description || '');
          setThumbnailUrl(linkData.thumbnailUrl || '');
        } catch (error) {
          console.log('Could not parse link data, starting fresh');
        }
      }
    }
  }, [lessonData, isLoading]);

  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
      setUrlError('URL is required');
      return false;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    if (!urlPattern.test(urlString)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }

    // Ensure URL has protocol
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://');
      return false;
    }

    setUrlError('');
    return true;
  };

  const handleUrlChange = (text: string) => {
    setUrl(text);
    if (urlError) {
      // Clear error when user starts typing
      setUrlError('');
    }
  };

  const handleUrlBlur = () => {
    if (url.trim()) {
      validateUrl(url);
    }
  };

  const handleSave = async () => {
    // Validate URL before saving
    if (!validateUrl(url)) {
      return;
    }

    setLoading(true);
    try {
      // Create link data object
      const linkData: LinkData = {
        url: url.trim(),
        description: description.trim(),
      };

      // Add thumbnail URL if provided
      if (thumbnailUrl.trim()) {
        linkData.thumbnailUrl = thumbnailUrl.trim();
      }

      // Store link data as JSON in description field
      const linkDataJson = JSON.stringify(linkData);
      console.log('💾 Saving link lesson data:', linkDataJson);

      await uploadLessonMedia(lessonID, '', linkDataJson);

      setLoading(false);
      Alert.alert('Success', 'Link lesson saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Save Error:', error);
      setLoading(false);

      const errorMessage = error?.message || 'Could not save link lesson. Please try again.';
      Alert.alert('Save Failed', errorMessage, [
        { text: 'OK', style: 'default' },
      ]);
    }
  };

  const isValidUrl = url.trim() && !urlError;

  return (
    <SafeAreaView style={styles.container}>
      <NavHead text={moduleTitle} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="link-outline" size={32} color={colors.primary} />
          <Text style={styles.headerTitle}>
            {isLoading ? '...' : lessonData?.name || 'Link Lesson'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Add an external resource or website link
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              URL <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, urlError && styles.inputError]}
              placeholder="https://example.com"
              value={url}
              onChangeText={handleUrlChange}
              onBlur={handleUrlBlur}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {urlError ? (
              <Text style={styles.errorText}>{urlError}</Text>
            ) : (
              <Text style={styles.helpText}>
                Enter the full URL including http:// or https://
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what students will find at this link..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.helpText}>
              Help students understand what this resource is about
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thumbnail URL (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              value={thumbnailUrl}
              onChangeText={setThumbnailUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.helpText}>
              Add an image URL to display a preview thumbnail
            </Text>
          </View>
        </View>

        {url && isValidUrl && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <Ionicons name="link" size={24} color={colors.primary} />
              <View style={styles.previewContent}>
                <Text style={styles.previewUrl} numberOfLines={1}>
                  {url}
                </Text>
                {description && (
                  <Text style={styles.previewDescription} numberOfLines={2}>
                    {description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !isValidUrl}
          style={[
            styles.saveButton,
            (loading || !isValidUrl) && styles.saveButtonDisabled,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Link Lesson'}
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
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  previewSection: {
    marginTop: 10,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  previewContent: {
    flex: 1,
    gap: 4,
  },
  previewUrl: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
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

export default LinkLessonEditor;
