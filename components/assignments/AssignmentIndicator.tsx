import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetAssignment } from '@/hooks/api/useAssignments';

interface AssignmentIndicatorProps {
  lessonId: string;
  isStudent?: boolean;
}

const AssignmentIndicator: React.FC<AssignmentIndicatorProps> = ({
  lessonId,
  isStudent = true,
}) => {
  const router = useRouter();
  const { data: assignment, isLoading } = useGetAssignment(lessonId);

  // Don't show anything if loading or no assignment
  if (isLoading || !assignment) {
    return null;
  }

  // Handle press - navigate to appropriate screen
  const handlePress = () => {
    if (isStudent) {
      router.push(`/student-screens/assignments/${assignment.id}` as any);
    } else {
      router.push(`/convener-screens/assignment/${lessonId}` as any);
    }
  };

  // Get submission status for students
  const getSubmissionStatus = () => {
    if (!isStudent || !assignment.mySubmission) {
      return null;
    }

    const { status, gradingStatus } = assignment.mySubmission;

    if (gradingStatus === 'passed') {
      return { icon: 'checkmark-circle' as const, color: '#10B981', text: 'Passed' };
    }
    if (gradingStatus === 'failed') {
      return { icon: 'close-circle' as const, color: '#EF4444', text: 'Failed' };
    }
    if (status === 'submitted') {
      return { icon: 'time' as const, color: '#3B82F6', text: 'Pending' };
    }
    return { icon: 'document-text' as const, color: '#F59E0B', text: 'Not Submitted' };
  };

  const submissionStatus = getSubmissionStatus();

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
    >
      <Ionicons name="clipboard-outline" size={14} color="#391D65" />
      <Text style={styles.text}>Assignment</Text>
      {isStudent && submissionStatus && (
        <View style={styles.statusContainer}>
          <Ionicons
            name={submissionStatus.icon}
            size={12}
            color={submissionStatus.color}
          />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ECDCFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  containerPressed: {
    backgroundColor: '#F3E8FF',
    borderColor: '#391D65',
  },
  text: {
    fontSize: 10,
    color: '#391D65',
    fontWeight: '500',
  },
  statusContainer: {
    marginLeft: 2,
  },
});

export default AssignmentIndicator;
