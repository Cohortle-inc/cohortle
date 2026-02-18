import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { useGetSubmission } from '@/hooks/api/useSubmissions';
import GradeSubmissionForm from '@/components/assignments/GradeSubmissionForm';
import ErrorBoundary from '@/components/ErrorBoundary';
import { formatFileSize } from '@/utils/fileUploadHelpers';

const SubmissionDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: submission,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSubmission(id || '');

  // Handle file download
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        showMessage({
          message: 'Cannot Open File',
          description: 'Unable to open this file type',
          type: 'warning',
        });
      }
    } catch (err) {
      showMessage({
        message: 'Download Failed',
        description: 'Failed to open file',
        type: 'danger',
      });
    }
  };

  // Handle grading success
  const handleGradeSuccess = () => {
    showMessage({
      message: 'Submission Graded',
      description: 'The submission has been graded successfully',
      type: 'success',
    });
    refetch();
  };

  // Format timestamp
  const formatTimestamp = (dateString: string | null): string => {
    if (!dateString) return 'Not available';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string): keyof typeof Ionicons.glyphMap => {
    if (fileType.includes('pdf')) return 'document-text';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word') || fileType.includes('doc')) return 'document';
    return 'document-attach';
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#391D65" />
        <Text style={styles.loadingText}>Loading submission...</Text>
      </View>
    );
  }

  // Error state
  if (isError || !submission) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Submission</Text>
        <Text style={styles.errorMessage}>
          {(error as any)?.message || 'An error occurred'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const isGraded = submission.gradingStatus !== 'pending';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#391D65" />
        </Pressable>
        <Text style={styles.headerTitle}>Submission Details</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Student Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Information</Text>
          <View style={styles.studentInfo}>
            <View style={styles.avatar}>
              {submission.student?.avatar ? (
                <Text style={styles.avatarText}>
                  {submission.student.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons name="person" size={24} color="#6B7280" />
              )}
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{submission.student?.name || 'Unknown Student'}</Text>
              <Text style={styles.studentEmail}>{submission.student?.email || ''}</Text>
            </View>
          </View>

          {/* Submission Metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.metadataLabel}>Submitted:</Text>
              <Text style={styles.metadataValue}>{formatTimestamp(submission.submittedAt)}</Text>
            </View>
            {isGraded && submission.gradedAt && (
              <View style={styles.metadataItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.metadataLabel}>Graded:</Text>
                <Text style={styles.metadataValue}>{formatTimestamp(submission.gradedAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Text Answer Card */}
        {submission.textAnswer && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Text Answer</Text>
            <View style={styles.textAnswerContainer}>
              <Text style={styles.textAnswer}>{submission.textAnswer}</Text>
            </View>
          </View>
        )}

        {/* Submitted Files Card */}
        {submission.files && submission.files.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submitted Files ({submission.files.length})</Text>
            {submission.files.map((file) => (
              <Pressable
                key={file.id}
                style={({ pressed }) => [
                  styles.fileItem,
                  pressed && styles.fileItemPressed,
                ]}
                onPress={() => handleDownloadFile(file.fileUrl, file.fileName)}
              >
                <View style={styles.fileIcon}>
                  <Ionicons name={getFileIcon(file.fileType)} size={24} color="#391D65" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.fileName}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.fileSize)}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#6B7280" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Existing Grade Display (if already graded) */}
        {isGraded && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Grade</Text>
            <View style={styles.gradeDisplay}>
              <View
                style={[
                  styles.gradeBadge,
                  submission.gradingStatus === 'passed'
                    ? styles.gradeBadgePassed
                    : styles.gradeBadgeFailed,
                ]}
              >
                <Ionicons
                  name={
                    submission.gradingStatus === 'passed'
                      ? 'checkmark-circle'
                      : 'close-circle'
                  }
                  size={20}
                  color={submission.gradingStatus === 'passed' ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.gradeText,
                    submission.gradingStatus === 'passed'
                      ? styles.gradeTextPassed
                      : styles.gradeTextFailed,
                  ]}
                >
                  {submission.gradingStatus === 'passed' ? 'Passed' : 'Failed'}
                </Text>
              </View>
              {submission.feedback && (
                <View style={styles.feedbackDisplay}>
                  <Text style={styles.feedbackLabel}>Feedback:</Text>
                  <Text style={styles.feedbackText}>{submission.feedback}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Grading Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isGraded ? 'Update Grade' : 'Grade Submission'}
          </Text>
          <GradeSubmissionForm submission={submission} onSuccess={handleGradeSuccess} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#391D65',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  metadataContainer: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  metadataValue: {
    fontSize: 13,
    color: '#1F2937',
  },
  textAnswerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  textAnswer: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  gradeDisplay: {
    gap: 12,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  gradeBadgePassed: {
    backgroundColor: '#D1FAE5',
  },
  gradeBadgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradeTextPassed: {
    color: '#10B981',
  },
  gradeTextFailed: {
    color: '#EF4444',
  },
  feedbackDisplay: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#391D65',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

// Wrap with error boundary
const SubmissionDetailScreenWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <SubmissionDetailScreen />
  </ErrorBoundary>
);

export default SubmissionDetailScreenWithErrorBoundary;
