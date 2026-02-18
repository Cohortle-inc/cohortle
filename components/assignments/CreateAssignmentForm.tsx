import React, { useState } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { Text } from '@/theme/theme';
import NormalInput from '@/components/Form/Input';
import TextAreaInput from '@/components/Form/TextArea';
import Button from '@/components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showMessage } from 'react-native-flash-message';
import { useCreateAssignment } from '@/hooks/api/useAssignments';
import { CreateAssignmentPayload } from '@/types/assignments';
import { validateAssignmentForm } from '@/utils/assignmentFormValidation';

interface CreateAssignmentFormProps {
  lessonId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateAssignmentForm: React.FC<CreateAssignmentFormProps> = ({
  lessonId,
  onSuccess,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 7 days from now
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [instructionsError, setInstructionsError] = useState('');
  const [dueDateError, setDueDateError] = useState('');

  const createAssignmentMutation = useCreateAssignment(lessonId);

  const validateForm = (): boolean => {
    const errors = validateAssignmentForm({
      title,
      instructions,
      dueDate,
    });

    // Set individual field errors
    setTitleError(errors.title || '');
    setInstructionsError(errors.instructions || '');
    setDueDateError(errors.dueDate || '');

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      showMessage({
        message: 'Validation Error',
        description: 'Please fix the errors and try again',
        type: 'danger',
      });
      return;
    }

    const payload: CreateAssignmentPayload = {
      title: title.trim(),
      instructions: instructions.trim(),
      dueDate: dueDate.toISOString(),
    };

    createAssignmentMutation.mutate(payload, {
      onSuccess: () => {
        showMessage({
          message: 'Success',
          description: 'Assignment created successfully',
          type: 'success',
        });

        // Reset form
        setTitle('');
        setInstructions('');
        setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error: any) => {
        showMessage({
          message: 'Error',
          description: error.message || 'Failed to create assignment',
          type: 'danger',
        });
      },
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS

    if (selectedDate) {
      setDueDate(selectedDate);
      setDueDateError(''); // Clear error when date is selected
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <Text style={styles.heading}>Create Assignment</Text>

        {/* Title Input */}
        <View style={styles.fieldContainer}>
          <NormalInput
            label="Assignment Title"
            placeholder="Enter assignment title"
            value={title}
            onChangeText={(text: string) => {
              setTitle(text);
              setTitleError('');
            }}
            error={titleError}
          />
        </View>

        {/* Instructions Input */}
        <View style={styles.fieldContainer}>
          <TextAreaInput
            label="Instructions"
            placeholder="Enter assignment instructions"
            value={instructions}
            onChangeText={(text: string) => {
              setInstructions(text);
              setInstructionsError('');
            }}
            numberOfLines={6}
          />
          {instructionsError && (
            <Text style={styles.errorText}>{instructionsError}</Text>
          )}
        </View>

        {/* Due Date Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Due Date</Text>
          <Button
            text={formatDate(dueDate)}
            onPress={() => setShowDatePicker(true)}
            variant="outline"
            style={styles.dateButton}
            textStyle={styles.dateButtonText}
          />
          {dueDateError && <Text style={styles.errorText}>{dueDateError}</Text>}

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            text={createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
            onPress={handleSubmit}
            disabled={createAssignmentMutation.isPending}
            style={styles.submitButton}
          />

          {onCancel && (
            <Button
              text="Cancel"
              onPress={onCancel}
              variant="outline"
              disabled={createAssignmentMutation.isPending}
              style={styles.cancelButton}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#391D65',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateButton: {
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
  },
  dateButtonText: {
    fontSize: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
});

export default CreateAssignmentForm;
