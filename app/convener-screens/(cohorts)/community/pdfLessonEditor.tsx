import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/utils/color';
import { NavHead } from '@/components/HeadRoute';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetLesson } from '@/api/communities/lessons/getLesson';
import { uploadLessonMedia } from '@/api/communities/lessons/uploadMedia';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const PdfLessonEditor = () => {
  const [pdfFile, setPdfFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lessonID = useLocalSearchParams().lessonId as string;
  const moduleTitle = (useLocalSearchParams().moduleTitle as string) || 'Module';
  const { data: lessonData, isLoading } = useGetLesson(lessonID);

  useEffect(() => {
    if (lessonData && !isLoading) {
      console.log('📥 Loading PDF lesson data');
      // Check if there's an existing PDF URL
      const pdfUrl = lessonData.url || lessonData.media || '';
      setExistingPdfUrl(pdfUrl);
    }
  }, [lessonData, isLoading]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picker cancelled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('PDF selected:', file.name, file.size);
        setPdfFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSave = async () => {
    if (!pdfFile && !existingPdfUrl) {
      Alert.alert('No PDF Selected', 'Please select a PDF file to upload.');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      let pdfUrl = existingPdfUrl;

      // If a new file was selected, upload it
      if (pdfFile) {
        console.log('💾 Uploading PDF file:', pdfFile.name);
        
        // Format the file object for upload
        const fileObject = {
          uri: pdfFile.uri,
          name: pdfFile.name,
          type: pdfFile.mimeType || 'application/pdf',
        };
        
        // Upload the PDF file
        await uploadLessonMedia(lessonID, fileObject, '');
        
        console.log('✅ PDF uploaded successfully');
      }

      setLoading(false);
      setUploading(false);

      Alert.alert('Success', 'PDF lesson saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Save Error:', error);
      setLoading(false);
      setUploading(false);

      const errorMessage = error?.message || 'Could not save PDF lesson. Please try again.';
      Alert.alert('Save Failed', errorMessage, [
        { text: 'OK', style: 'default' },
      ]);
    }
  };

  const renderPdfPreview = () => {
    if (pdfFile) {
      return (
        <View style={styles.previewBox}>
          <View style={styles.pdfPlaceholder}>
            <Ionicons name="document-attach" size={48} color={colors.primary} />
          </View>
          <Text style={styles.fileName} numberOfLines={2}>
            {pdfFile.name}
          </Text>
          <Text style={styles.fileSize}>
            {pdfFile.size ? formatFileSize(pdfFile.size) : 'Unknown size'}
          </Text>
          <TouchableOpacity onPress={handlePickDocument} style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Change PDF</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (existingPdfUrl) {
      return (
        <View style={styles.previewBox}>
          <View style={styles.pdfPlaceholder}>
            <Ionicons name="document-attach" size={48} color={colors.primary} />
          </View>
          <Text style={styles.fileName} numberOfLines={2}>
            Existing PDF Document
          </Text>
          <Text style={styles.fileUrl} numberOfLines={1}>
            {existingPdfUrl}
          </Text>
          <TouchableOpacity onPress={handlePickDocument} style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Replace PDF</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavHead text={moduleTitle} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="document-attach-outline" size={32} color={colors.primary} />
          <Text style={styles.headerTitle}>
            {isLoading ? '...' : lessonData?.name || 'PDF Lesson'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Upload a PDF document for students to view
          </Text>
        </View>

        <View style={styles.uploadSection}>
          <Ionicons name="cloud-upload-outline" color={colors.primary} size={32} />
          <Text style={styles.sectionTitle}>PDF Document</Text>
          <Text style={styles.sectionSubtitle}>
            Select a PDF file from your device
          </Text>

          {renderPdfPreview()}

          {!pdfFile && !existingPdfUrl && (
            <TouchableOpacity
              onPress={handlePickDocument}
              style={styles.pickButton}
            >
              <Ionicons name="folder-open-outline" size={20} color="#fff" />
              <Text style={styles.pickButtonText}>Select PDF File</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.helpText}>
            💡 Tip: Make sure your PDF is optimized for mobile viewing
          </Text>
        </View>

        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading PDF...</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || (!pdfFile && !existingPdfUrl)}
          style={[
            styles.saveButton,
            (loading || (!pdfFile && !existingPdfUrl)) && styles.saveButtonDisabled,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save PDF Lesson'}
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
  uploadSection: {
    borderWidth: 2,
    borderColor: colors.purpleShade,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
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
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewBox: {
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  pdfPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 250,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fileUrl: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
    marginTop: 4,
  },
  changeButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
  },
  changeButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  uploadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
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

export default PdfLessonEditor;
