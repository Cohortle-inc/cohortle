import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import FileUploadInput from './FileUploadInput';
import { useSubmitAssignment } from '@/hooks/api/useSubmissions';
import { saveDraft, loadDraft } from '@/utils/draftManager';
import { LocalFile, Assignment } from '@/types/assignments';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OfflineBanner from '@/components/ui/OfflineBanner';
import PendingOperationsIndicator from '@/components/ui/PendingOperationsIndicator';
import { addToQueue } from '@/utils/offlineQueue';

interface SubmitAssignmentFormProps {
  assignment: Assignment;
  onSuccess?: () => void;
}

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const SubmitAssignmentForm: React.FC<SubmitAssignmentFormProps> = ({
  assignment,
  onSuccess,
}) => {
  const [textAnswer, setTextAnswer] = useState('');
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate: submit, isPending: isSubmitting } = useSubmitAssignment(assignment.id);
  const { isConnected } = useNetworkStatus();

  // Check if assignment is past due date
  const isPastDue = new Date() > new Date(assignment.dueDate);

  // Load draft on mount
  useEffect(() => {
    const loadExistingDraft = async () => {
      try {
        const draft = await loadDraft(assignment.id);
        if (draft) {
          setTextAnswer(draft.textAnswer || '');
          setFiles(draft.files || []);
          setLastSaved(new Date(draft.lastModified));
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadExistingDraft();
  }, [assignment.id]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isLoadingDraft || isPastDue) {
      return;
    }

    const saveCurrentDraft = async () => {
      try {
        await saveDraft(assignment.id, textAnswer, files);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error auto-saving draft:', error);
      }
    };

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up new timer
    autoSaveTimerRef.current = setInterval(saveCurrentDraft, AUTO_SAVE_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [textAnswer, files, assignment.id, isLoadingDraft, isPastDue]);

  // Validate submission
  const validateSubmission = (): boolean => {
    const hasText = textAnswer.trim().length > 0;
    const hasFiles = files.length > 0;

    if (!hasText && !hasFiles) {
      showMessage({
        message: 'Submission Required',
        description: 'Please provide either a text answer or upload at least one file',
        type: 'warning',
      });
      return false;
    }

    return true;
  };

  // Handle submission
  const handleSubmit = () => {
    if (!validateSubmission()) {
      return;
    }

    // Check if offline - queue the operation
    if (!isConnected) {
      Alert.alert(
        'Offline Submission',
        'You are currently offline. Your submission will be queued and sent automatically when you reconnect.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Queue Submission',
            onPress: async () => {
              try {
                await addToQueue({
                  type: 'submit_assignment',
                  assignmentId: assignment.id,
                  textAnswer: textAnswer.trim() || null,
                  files,
                });
                
                showMessage({
                  message: 'Queued for Sync',
                  description: 'Your submission will be sent when you reconnect to the internet',
                  type: 'success',
                });
                
                onSuccess?.();
              } catch (error) {
                console.error('Error queuing submission:', error);
                showMessage({
                  message: 'Queue Failed',
                  description: 'Failed to queue submission. Please try again.',
                  type: 'danger',
                });
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Submit Assignment',
      'Are you sure you want to submit? You can edit your submission until the due date.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            submit(
              {
                textAnswer: textAnswer.trim() || null,
                files,
              },
              {
                onSuccess: () => {
                  showMessage({
                    message: 'Success',
                    description: 'Your assignment has been submitted successfully',
                    type: 'success',
                  });
                  onSuccess?.();
                },
                onError: (error: any) => {
                  console.error('Submission error:', error);
                  showMessage({
                    message: 'Submission Failed',
                    description:
                      error?.response?.data?.message ||
                      'Failed to submit assignment. Please try again.',
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

  // Handle manual save
  const handleManualSave = async () => {
    try {
      await saveDraft(assignment.id, textAnswer, files);
      setLastSaved(new Date());
      showMessage({
        message: 'Draft Saved',
        description: 'Your work has been saved',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      showMessage({
        message: 'Save Failed',
        description: 'Failed to save draft. Please try again.',
        type: 'danger',
      });
    }
  };

  if (isLoadingDraft) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#391D65" />
        <Text style={styles.loadingText}>Loading draft...</Text>
      </View>
    );
  }

  if (isPastDue) {
    return (
      <View style={styles.disabledContainer}>
        <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
        <Text style={styles.disabledTitle}>Submission Closed</Text>
        <Text style={styles.disabledText}>
          The due date for this assignment has passed. Submissions are no longer accepted.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Pending Operations Indicator */}
      <PendingOperationsIndicator />

      {/* Text Answer Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Your Answer</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type your answer here..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          value={textAnswer}
          onChangeText={setTextAnswer}
          editable={!isSubmitting}
        />
      </View>

      {/* File Upload */}
      <View style={styles.section}>
        <FileUploadInput
          files={files}
          onFilesChange={setFiles}
          disabled={isSubmitting}
        />
      </View>

      {/* Auto-save indicator */}
      {lastSaved && (
        <View style={styles.autoSaveIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.autoSaveText}>
            Last saved: {lastSaved.toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {/* Save Draft Button */}
        <Pressable
          onPress={handleManualSave}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
        >
          <Ionicons name="save-outline" size={20} color="#391D65" />
          <Text style={styles.saveButtonText}>Save Draft</Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Help Text */}
      <Text style={styles.helpText}>
        Your work is automatically saved every 30 seconds. You can edit your submission until
        the due date.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoSaveText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#391D65',
    borderRadius: 8,
    padding: 14,
  },
  saveButtonPressed: {
    backgroundColor: '#F9FAFB',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#391D65',
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flex: 1,
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
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default SubmitAssignmentForm;
