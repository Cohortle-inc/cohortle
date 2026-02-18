import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGetAssignmentById } from '@/hooks/api/useAssignments';
import { useGetMySubmission } from '@/hooks/api/useSubmissions';
import SubmitAssignmentForm from '@/components/assignments/SubmitAssignmentForm';
import ErrorBoundary from '@/components/ErrorBoundary';

const AssignmentDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: assignment,
    isLoading: isLoadingAssignment,
    isError: isAssignmentError,
    error: assignmentError,
    refetch: refetchAssignment,
  } = useGetAssignmentById(id || '');

  const {
    data: submission,
    isLoading: isLoadingSubmission,
  } = useGetMySubmission(id || '');

  // Format due date
  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if past due date
  const isPastDue = assignment ? new Date() > new Date(assignment.dueDate) : false;

  // Check if can submit/edit
  const canSubmitOrEdit = !isPastDue && (!submission || submission.status !== 'graded');

  // Loading state
  if (isLoadingAssignment || isLoadingSubmission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#391D65" />
        <Text style={styles.loadingText}>Loading assignment...</Text>
      </View>
    );
  }

  // Error state
  if (isAssignmentError || !assignment) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Assignment</Text>
        <Text style={styles.errorMessage}>
          {(assignmentError as any)?.message || 'Assignment not found'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetchAssignment()}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Show graded submission view
  if (submission && submission.status === 'graded') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backIconButton}>
            <Ionicons name="arrow-back" size={24} color="#391D65" />
          </Pressable>
          <Text style={styles.headerTitle}>Assignment Details</Text>
        </View>

        {/* Assignment Info */}
        <View style={styles.section}>
          <Text style={styles.title}>{assignment.title}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>Due: {formatDueDate(assignment.dueDate)}</Text>
          </View>

          {assignment.lesson && (
            <View style={styles.metaRow}>
              <Ionicons name="book-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>Lesson: {assignment.lesson.title}</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructions}>{assignment.instructions}</Text>
        </View>

        {/* Grade Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Grade</Text>
          <View
            style={[
              styles.gradeBadge,
              submission.gradingStatus === 'passed'
                ? styles.gradeBadgePass
                : styles.gradeBadgeFail,
            ]}
          >
            <Ionicons
              name={submission.gradingStatus === 'passed' ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={submission.gradingStatus === 'passed' ? '#10B981' : '#EF4444'}
            />
            <Text
              style={[
                styles.gradeText,
                submission.gradingStatus === 'passed'
                  ? styles.gradeTextPass
                  : styles.gradeTextFail,
              ]}
            >
              {submission.gradingStatus === 'passed' ? 'PASSED' : 'FAILED'}
            </Text>
          </View>

          {submission.gradedAt && (
            <Text style={styles.gradedDate}>
              Graded on {new Date(submission.gradedAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Feedback */}
        {submission.feedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback from Instructor</Text>
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{submission.feedback}</Text>
            </View>
          </View>
        )}

        {/* Your Submission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Submission</Text>
          
          {submission.textAnswer && (
            <View style={styles.submissionContent}>
              <Text style={styles.submissionLabel}>Text Answer:</Text>
              <Text style={styles.submissionText}>{submission.textAnswer}</Text>
            </View>
          )}

          {submission.files && submission.files.length > 0 && (
            <View style={styles.submissionContent}>
              <Text style={styles.submissionLabel}>
                Submitted Files ({submission.files.length}):
              </Text>
              {submission.files.map((file) => (
                <View key={file.id} style={styles.fileItem}>
                  <Ionicons name="document" size={20} color="#391D65" />
                  <Text style={styles.fileName}>{file.fileName}</Text>
                </View>
              ))}
            </View>
          )}

          {submission.submittedAt && (
            <Text style={styles.submittedDate}>
              Submitted on {new Date(submission.submittedAt).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }

  // Show submission form
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backIconButton}>
          <Ionicons name="arrow-back" size={24} color="#391D65" />
        </Pressable>
        <Text style={styles.headerTitle}>Assignment Details</Text>
      </View>

      {/* Assignment Info */}
      <View style={styles.section}>
        <Text style={styles.title}>{assignment.title}</Text>
        
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={[styles.metaText, isPastDue && styles.metaTextOverdue]}>
            Due: {formatDueDate(assignment.dueDate)}
          </Text>
        </View>

        {isPastDue && (
          <View style={styles.overdueAlert}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.overdueText}>This assignment is overdue</Text>
          </View>
        )}

        {assignment.lesson && (
          <View style={styles.metaRow}>
            <Ionicons name="book-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>Lesson: {assignment.lesson.title}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructions}>{assignment.instructions}</Text>
      </View>

      {/* Submission Form or Status */}
      {canSubmitOrEdit ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Submission</Text>
          <SubmitAssignmentForm
            assignment={assignment}
            onSuccess={() => {
              refetchAssignment();
              router.back();
            }}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.statusTitle}>Submission Received</Text>
            <Text style={styles.statusMessage}>
              Your assignment has been submitted and is awaiting review
            </Text>
            {submission?.submittedAt && (
              <Text style={styles.statusDate}>
                Submitted on {new Date(submission.submittedAt).toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
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
  backIconButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaTextOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  overdueText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
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
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#391D65',
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  gradeBadgePass: {
    backgroundColor: '#D1FAE5',
  },
  gradeBadgeFail: {
    backgroundColor: '#FEE2E2',
  },
  gradeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  gradeTextPass: {
    color: '#065F46',
  },
  gradeTextFail: {
    color: '#991B1B',
  },
  gradedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  feedbackContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  submissionContent: {
    marginBottom: 16,
  },
  submissionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  submissionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  submittedDate: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 32,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusDate: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

// Wrap with error boundary
const AssignmentDetailScreenWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <AssignmentDetailScreen />
  </ErrorBoundary>
);

export default AssignmentDetailScreenWithErrorBoundary;
