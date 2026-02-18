import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import { useGradeSubmission } from '@/hooks/api/useSubmissions';
import { Submission, GradeSubmissionPayload } from '@/types/assignments';
import { formatFileSize } from '@/utils/fileUploadHelpers';

interface GradeSubmissionFormProps {
  submission: Submission;
  onSuccess?: () => void;
}

const GradeSubmissionForm: React.FC<GradeSubmissionFormProps> = ({
  submission,
  onSuccess,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'passed' | 'failed' | null>(
    submission.gradingStatus === 'pending' ? null : submission.gradingStatus
  );
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const { mutate: grade, isPending: isGrading } = useGradeSubmission(
    submission.assignmentId
  );

  const isAlreadyGraded = submission.gradingStatus !== 'pending';

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
    } catch (error) {
      console.error('Error opening file:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to open file',
        type: 'danger',
      });
    }
  };

  // Handle grade submission
  const handleSubmitGrade = () => {
    if (!selectedGrade) {
      showMessage({
        message: 'Grade Required',
        description: 'Please select Pass or Fail',
        type: 'warning',
      });
      return;
    }

    const action = isAlreadyGraded ? 'update' : 'submit';
    const actionText = isAlreadyGraded ? 'Update Grade' : 'Submit Grade';

    Alert.alert(
      actionText,
      `Are you sure you want to ${action} this grade?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          onPress: () => {
            const payload: GradeSubmissionPayload = {
              status: selectedGrade,
              feedback: feedback.trim() || undefined,
            };

            grade(
              { submissionId: submission.id, payload },
              {
                onSuccess: () => {
                  showMessage({
                    message: 'Success',
                    description: `Grade ${action}d successfully`,
                    type: 'success',
                  });
                  onSuccess?.();
                },
                onError: (error: any) => {
                  console.error('Grading error:', error);
                  showMessage({
                    message: 'Grading Failed',
                    description:
                      error?.response?.data?.message ||
                      `Failed to ${action} grade. Please try again.`,
                    type: 'danger',
                  });
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Student Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student</Text>
        <View style={styles.studentInfo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{submission.student?.name || 'Unknown'}</Text>
            <Text style={styles.studentEmail}>{submission.student?.email || ''}</Text>
          </View>
        </View>
        {submission.submittedAt && (
          <Text style={styles.submittedDate}>
            Submitted: {new Date(submission.submittedAt).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Text Answer */}
      {submission.textAnswer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Answer</Text>
          <View style={styles.textAnswerContainer}>
            <Text style={styles.textAnswer}>{submission.textAnswer}</Text>
          </View>
        </View>
      )}

      {/* Submitted Files */}
      {submission.files && submission.files.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Submitted Files ({submission.files.length})
          </Text>
          {submission.files.map((file) => (
            <Pressable
              key={file.id}
              onPress={() => handleDownloadFile(file.fileUrl, file.fileName)}
              style={({ pressed }) => [
                styles.fileItem,
                pressed && styles.fileItemPressed,
              ]}
            >
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={24} color="#391D65" />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.fileName}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.fileSize)}</Text>
                </View>
              </View>
              <Ionicons name="download-outline" size={20} color="#6B7280" />
            </Pressable>
          ))}
        </View>
      )}

      {/* Grading Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isAlreadyGraded ? 'Update Grade' : 'Grade Submission'}
        </Text>

        {/* Pass/Fail Selection */}
        <View style={styles.gradeOptions}>
          <Pressable
            onPress={() => setSelectedGrade('passed')}
            disabled={isGrading}
            style={({ pressed }) => [
              styles.gradeOption,
              selectedGrade === 'passed' && styles.gradeOptionSelected,
              selectedGrade === 'passed' && styles.gradeOptionPass,
              pressed && styles.gradeOptionPressed,
              isGrading && styles.gradeOptionDisabled,
            ]}
          >
            <Ionicons
              name={selectedGrade === 'passed' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={24}
              color={selectedGrade === 'passed' ? '#10B981' : '#6B7280'}
            />
            <Text
              style={[
                styles.gradeOptionText,
                selectedGrade === 'passed' && styles.gradeOptionTextSelected,
              ]}
            >
              Pass
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedGrade('failed')}
            disabled={isGrading}
            style={({ pressed }) => [
              styles.gradeOption,
              selectedGrade === 'failed' && styles.gradeOptionSelected,
              selectedGrade === 'failed' && styles.gradeOptionFail,
              pressed && styles.gradeOptionPressed,
              isGrading && styles.gradeOptionDisabled,
            ]}
          >
            <Ionicons
              name={selectedGrade === 'failed' ? 'close-circle' : 'close-circle-outline'}
              size={24}
              color={selectedGrade === 'failed' ? '#EF4444' : '#6B7280'}
            />
            <Text
              style={[
                styles.gradeOptionText,
                selectedGrade === 'failed' && styles.gradeOptionTextSelected,
              ]}
            >
              Fail
            </Text>
          </Pressable>
        </View>

        {/* Feedback Input */}
        <View style={styles.feedbackContainer}>
          <Text style={styles.label}>Feedback (Optional)</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Provide feedback to the student..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={feedback}
            onChangeText={setFeedback}
            editable={!isGrading}
          />
          <Text style={styles.helpText}>
            This feedback will be visible to the student
          </Text>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmitGrade}
          disabled={isGrading || !selectedGrade}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
            (isGrading || !selectedGrade) && styles.submitButtonDisabled,
          ]}
        >
          {isGrading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isAlreadyGraded ? 'Update Grade' : 'Submit Grade'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Current Grade Display (if already graded) */}
      {isAlreadyGraded && (
        <View style={styles.currentGradeContainer}>
          <View style={styles.currentGradeHeader}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.currentGradeTitle}>Current Grade</Text>
          </View>
          <View
            style={[
              styles.currentGradeBadge,
              submission.gradingStatus === 'passed'
                ? styles.currentGradeBadgePass
                : styles.currentGradeBadgeFail,
            ]}
          >
            <Text
              style={[
                styles.currentGradeText,
                submission.gradingStatus === 'passed'
                  ? styles.currentGradeTextPass
                  : styles.currentGradeTextFail,
              ]}
            >
              {submission.gradingStatus === 'passed' ? 'PASSED' : 'FAILED'}
            </Text>
          </View>
          {submission.gradedAt && (
            <Text style={styles.gradedDate}>
              Graded: {new Date(submission.gradedAt).toLocaleString()}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#391D65',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  submittedDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  textAnswerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
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
  gradeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gradeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  gradeOptionPressed: {
    backgroundColor: '#F9FAFB',
  },
  gradeOptionSelected: {
    borderWidth: 2,
  },
  gradeOptionPass: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  gradeOptionFail: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  gradeOptionDisabled: {
    opacity: 0.5,
  },
  gradeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  gradeOptionTextSelected: {
    color: '#1F2937',
  },
  feedbackContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
    fontWeight: '500',
  },
  feedbackInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#391D65',
    borderRadius: 8,
    padding: 14,
  },
  submitButtonPressed: {
    backgroundColor: '#2D1550',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  currentGradeContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  currentGradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentGradeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  currentGradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  currentGradeBadgePass: {
    backgroundColor: '#D1FAE5',
  },
  currentGradeBadgeFail: {
    backgroundColor: '#FEE2E2',
  },
  currentGradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  currentGradeTextPass: {
    color: '#065F46',
  },
  currentGradeTextFail: {
    color: '#991B1B',
  },
  gradedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default GradeSubmissionForm;
