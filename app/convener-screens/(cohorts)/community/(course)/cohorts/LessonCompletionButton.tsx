import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useCompleteLesson } from '@/api/lessons/completeLesson';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';

interface LessonCompletionButtonProps {
  lessonId: number;
  cohortId: number;
  onCompleted?: () => void;
}

const LessonCompletionButton: React.FC<LessonCompletionButtonProps> = ({
  lessonId,
  cohortId,
  onCompleted,
}) => {
  const { mutate, isPending } = useCompleteLesson();

  const handlePress = () => {
    mutate(
      { lessonId, cohort_id: cohortId },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Lesson marked as complete!');
          if (onCompleted) onCompleted();
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to complete lesson');
        },
      }
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, isPending && styles.disabledButton]}
      onPress={handlePress}
      disabled={isPending}
    >
      {isPending ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.text}>Complete Lesson</Text>
      )}
    </TouchableOpacity>
  );
};

export default LessonCompletionButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary || '#4B0082',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  disabledButton: {
    backgroundColor: '#94d3a2',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
