import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { useGetAssignment, useDeleteAssignment } from '@/hooks/api/useAssignments';
import CreateAssignmentForm from '@/components/assignments/CreateAssignmentForm';
import EditAssignmentForm from '@/components/assignments/EditAssignmentForm';
import SubmissionList from '@/components/assignments/SubmissionList';
import DownloadSubmissionsButton from '@/components/assignments/DownloadSubmissionsButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Submission } from '@/types/assignments';

const ConvenerAssignmentScreen: React.FC = () => {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: assignment,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAssignment(lessonId || '');

  const deleteAssignmentMutation = useDeleteAssignment(lessonId || '');

  // Handle assignment creation success
  const handleCreateSuccess = () => {
    showMessage({
      message: 'Assignment Created',
      description: 'The assignment has been created successfully',
      type: 'success',
    });
    refetch();
  };

  // Handle assignment update success
  const handleUpdateSuccess = () => {
    showMessage({
      message: 'Assignment Updated',
      description: 'The assignment has been updated successfully',
      type: 'success',
    });
    setIsEditing(false);
    refetch();
  };

  // Handle delete assignment
  const handleDeleteAssignment = () => {
    if (!assignment) return;

    Alert.alert(
      'Delete Assignment',
      'Are you sure you want to delete this assignment? This action cannot be undone and will delete all student submissions.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAssignmentMutation.mutate(assignment.id, {
              onSuccess: () => {
                showMessage({
                  message: 'Assignment Deleted',
                  description: 'The assignment has been deleted successfully',
                  type: 'success',
                });
                refetch();
              },
              onError: (err: any) => {
                showMessage({
                  message: 'Delete Failed',
                  description: err?.message || 'Failed to delete assignment',
                  type: 'danger',
                });
              },
            });
          },
        },
      ]
    );
  };

  // Handle submission press
  const handleSubmissionPress = (submission: Submission) => {
    router.push(`/convener-screens/submission/${submission.id}` as any);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#391D65" />
        <Text style={styles.loadingText}>Loading assignment...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Assignment</Text>
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

  // No assignment exists - show create form
  if (!assignment) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#391D65" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Assignment</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Create an assignment for this lesson. Students will be able to submit their work
              through text answers and file uploads.
            </Text>
          </View>

          <CreateAssignmentForm
            lessonId={lessonId || ''}
            onSuccess={handleCreateSuccess}
            onCancel={() => router.back()}
          />
        </View>
      </ScrollView>
    );
  }

  // Assignment exists - show details and submissions
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#391D65" />
        </Pressable>
        <Text style={styles.headerTitle}>Assignment Management</Text>
      </View>

      {/* Assignment Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.detailsHeader}>
          <View style={styles.detailsHeaderLeft}>
            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            <Text style={styles.assignmentMeta}>
              Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.detailsActions}>
            {!isEditing && (
              <>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create-outline" size={20} color="#391D65" />
                </Pressable>
                <Pressable
                  style={[styles.iconButton, styles.deleteButton]}
                  onPress={handleDeleteAssignment}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </>
            )}
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editFormContainer}>
            <EditAssignmentForm
              assignment={assignment}
              lessonId={lessonId || ''}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setIsEditing(false)}
            />
          </View>
        ) : (
          <Text style={styles.assignmentInstructions}>{assignment.instructions}</Text>
        )}
      </View>

      {/* Statistics and Actions Bar */}
      {!isEditing && (
        <View style={styles.actionsBar}>
          <View style={styles.statsSection}>
            <View style={styles.statBadge}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {assignment.submissionStats?.total || 0} Students
              </Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statText}>
                {assignment.submissionStats?.submitted || 0} Submitted
              </Text>
            </View>
          </View>
          <DownloadSubmissionsButton assignmentId={assignment.id} />
        </View>
      )}

      {/* Submissions List */}
      {!isEditing && (
        <SubmissionList
          assignmentId={assignment.id}
          onSubmissionPress={handleSubmissionPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
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
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailsHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  assignmentMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  editFormContainer: {
    marginTop: 16,
  },
  assignmentInstructions: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
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
const ConvenerAssignmentScreenWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <ConvenerAssignmentScreen />
  </ErrorBoundary>
);

export default ConvenerAssignmentScreenWithErrorBoundary;
