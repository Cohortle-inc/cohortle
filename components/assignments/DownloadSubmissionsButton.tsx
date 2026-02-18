import React, { useState } from 'react';
import { Pressable, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { downloadAllSubmissions } from '@/api/submissions/downloadSubmissions';

interface DownloadSubmissionsButtonProps {
  assignmentId: string;
  assignmentTitle: string;
  submissionCount: number;
  disabled?: boolean;
}

const DownloadSubmissionsButton: React.FC<DownloadSubmissionsButtonProps> = ({
  assignmentId,
  assignmentTitle,
  submissionCount,
  disabled = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    // Check if there are submissions to download
    if (submissionCount === 0) {
      Alert.alert(
        'No Submissions',
        'There are no submissions to download for this assignment.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirm download
    Alert.alert(
      'Download Submissions',
      `Download all ${submissionCount} submission${submissionCount !== 1 ? 's' : ''} for "${assignmentTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            setIsDownloading(true);

            try {
              // Show initial message
              showMessage({
                message: 'Preparing Download',
                description: 'Please wait while we package the submissions...',
                type: 'info',
                duration: 3000,
              });

              // Download the blob from API
              const blob = await downloadAllSubmissions(assignmentId);

              // Generate filename with timestamp
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
              const sanitizedTitle = assignmentTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
              const filename = `${sanitizedTitle}_submissions_${timestamp}.zip`;

              // Convert blob to base64 for React Native
              const reader = new FileReader();
              reader.readAsDataURL(blob);

              reader.onloadend = async () => {
                try {
                  const base64data = reader.result as string;
                  const base64 = base64data.split(',')[1]; // Remove data URL prefix

                  // Save to device's cache directory
                  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
                  await FileSystem.writeAsStringAsync(fileUri, base64, {
                    encoding: FileSystem.EncodingType.Base64,
                  });

                  // Check if sharing is available
                  const isSharingAvailable = await Sharing.isAvailableAsync();

                  if (isSharingAvailable) {
                    // Share the file (allows user to save to their preferred location)
                    await Sharing.shareAsync(fileUri, {
                      mimeType: 'application/zip',
                      dialogTitle: 'Save Submissions',
                      UTI: 'public.zip-archive',
                    });

                    showMessage({
                      message: 'Download Complete',
                      description: `${submissionCount} submission${submissionCount !== 1 ? 's' : ''} downloaded successfully`,
                      type: 'success',
                    });
                  } else {
                    // Fallback: file is saved to cache directory
                    showMessage({
                      message: 'Download Complete',
                      description: `File saved to: ${fileUri}`,
                      type: 'success',
                      duration: 5000,
                    });
                  }
                } catch (error) {
                  console.error('Error saving file:', error);
                  showMessage({
                    message: 'Save Failed',
                    description: 'Failed to save the downloaded file. Please try again.',
                    type: 'danger',
                  });
                }
              };

              reader.onerror = () => {
                console.error('Error reading blob');
                showMessage({
                  message: 'Download Failed',
                  description: 'Failed to process the downloaded file. Please try again.',
                  type: 'danger',
                });
              };
            } catch (error: any) {
              console.error('Download error:', error);
              showMessage({
                message: 'Download Failed',
                description: error?.message || 'Failed to download submissions. Please try again.',
                type: 'danger',
              });
            } finally {
              setIsDownloading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={handleDownload}
      disabled={disabled || isDownloading || submissionCount === 0}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        (disabled || isDownloading || submissionCount === 0) && styles.buttonDisabled,
      ]}
    >
      {isDownloading ? (
        <>
          <ActivityIndicator size="small" color="#391D65" />
          <Text style={styles.buttonText}>Downloading...</Text>
        </>
      ) : (
        <>
          <Ionicons name="download-outline" size={20} color="#391D65" />
          <Text style={styles.buttonText}>Download All</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#391D65',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 140,
  },
  buttonPressed: {
    backgroundColor: '#F9FAFB',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    color: '#391D65',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DownloadSubmissionsButton;
