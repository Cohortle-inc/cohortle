import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '../ThemedText';

type FileAttachFieldProps = {
  label: string;
  onFileSelect: (file: DocumentPicker.DocumentPickerAsset) => void;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

function FileAttachField({
  label,
  onFileSelect,
  error,
  icon = 'attach-outline',
}: FileAttachFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // You can restrict this to ["image/*", "application/pdf"] if needed
        copyToCacheDirectory: true,
        multiple: false,
      });

      // handle cancel or success safely
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileName(file.name);
        onFileSelect(file);
      }
    } catch (error) {
      console.warn('File selection failed:', error);
    }
  };

  return (
    <View style={styles.inputWrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      <Pressable
        style={[styles.attachContainer, error && styles.errorInput]}
        onPress={handleFilePick}
      >
        {icon && (
          <Ionicons name={icon} size={20} color="#999" style={styles.icon} />
        )}
        <Text style={styles.attachText}>
          {fileName ? fileName : 'Tap to attach file'}
        </Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {},
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  attachContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: '#F9F9F9',
    height: 120,
  },
  attachText: {
    fontSize: 14,
    color: '#666',
    width: 'auto',
  },
  icon: {
    marginRight: 8,
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

export default FileAttachField;
