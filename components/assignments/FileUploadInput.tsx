import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LocalFile } from '@/types/assignments';
import { validateFile } from '@/utils/fileValidation';
import {
  getFileIcon,
  formatFileSize,
  wouldExceedMaxFiles,
  getMaxFilesError,
} from '@/utils/fileUploadHelpers';

interface FileUploadInputProps {
  files: LocalFile[];
  onFilesChange: (files: LocalFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const FileUploadInput: React.FC<FileUploadInputProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  disabled = false,
}) => {
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // Handle file selection
  const handleSelectFiles = async () => {
    if (disabled) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false, // Better performance
        multiple: true, // Allow multiple file selection
      });

      if (result.canceled) {
        return;
      }

      // Convert DocumentPicker assets to LocalFile format
      const newFiles: LocalFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size || 0,
      }));

      // Validate each file
      const errors = new Map<string, string>();
      const validFiles: LocalFile[] = [];

      for (const file of newFiles) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.set(file.uri, validation.error || 'Invalid file');
        }
      }

      // Check if adding these files would exceed max files
      if (wouldExceedMaxFiles(files.length, validFiles.length, maxFiles)) {
        Alert.alert(
          'Too Many Files',
          getMaxFilesError(maxFiles),
          [{ text: 'OK' }]
        );
        return;
      }

      // Update files and errors
      setValidationErrors(errors);
      
      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles]);
      }

      // Show error alert if any files were invalid
      if (errors.size > 0) {
        const errorMessages = Array.from(errors.entries())
          .map(([uri, error]) => {
            const fileName = newFiles.find(f => f.uri === uri)?.name || 'Unknown file';
            return `• ${fileName}: ${error}`;
          })
          .join('\n');

        Alert.alert(
          'Some Files Invalid',
          `The following files could not be added:\n\n${errorMessages}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert(
        'Error',
        'Failed to select files. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle file removal
  const handleRemoveFile = (uri: string) => {
    if (disabled) return;

    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedFiles = files.filter(file => file.uri !== uri);
            onFilesChange(updatedFiles);
            
            // Remove validation error if exists
            const newErrors = new Map(validationErrors);
            newErrors.delete(uri);
            setValidationErrors(newErrors);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>Attachments</Text>

      {/* File List */}
      {files.length > 0 && (
        <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
          {files.map((file, index) => (
            <View key={file.uri} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Ionicons
                  name={getFileIcon(file.name)}
                  size={24}
                  color="#391D65"
                  style={styles.fileIcon}
                />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
              </View>

              {/* Remove button */}
              {!disabled && (
                <Pressable
                  onPress={() => handleRemoveFile(file.uri)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.removeButtonPressed,
                  ]}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </Pressable>
              )}

              {/* Validation error */}
              {validationErrors.has(file.uri) && (
                <Text style={styles.errorText}>{validationErrors.get(file.uri)}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Files Button */}
      {!disabled && files.length < maxFiles && (
        <Pressable
          onPress={handleSelectFiles}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Ionicons name="add-circle-outline" size={24} color="#391D65" />
          <Text style={styles.addButtonText}>
            {files.length === 0 ? 'Select Files' : 'Add More Files'}
          </Text>
        </Pressable>
      )}

      {/* File count info */}
      {files.length > 0 && (
        <Text style={styles.fileCount}>
          {files.length} of {maxFiles} files selected
        </Text>
      )}

      {/* Help text */}
      <Text style={styles.helpText}>
        Supported formats: PDF, PNG, JPG, DOC, DOCX (Max 10MB per file)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
    fontWeight: '500',
  },
  fileList: {
    maxHeight: 300,
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeButtonPressed: {
    opacity: 0.6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#391D65',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  addButtonPressed: {
    backgroundColor: '#F9FAFB',
  },
  addButtonText: {
    fontSize: 14,
    color: '#391D65',
    fontWeight: '500',
    marginLeft: 8,
  },
  fileCount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default FileUploadInput;
