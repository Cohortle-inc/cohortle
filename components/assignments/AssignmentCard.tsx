import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/theme/theme';
import { Assignment } from '@/types/assignments';
import { Ionicons } from '@expo/vector-icons';

interface AssignmentCardProps {
  assignment: Assignment;
  onPress?: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onPress }) => {
  // Check if assignment is overdue
  const isOverdue = assignment.mySubmission?.status !== 'submitted' && 
                    assignment.mySubmission?.status !== 'graded' &&
                    new Date(assignment.dueDate) < new Date();

  // Format due date
  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Get submission status badge
  const getStatusBadge = () => {
    if (!assignment.mySubmission) {
      return (
        <View style={[styles.badge, styles.badgeNotSubmitted]}>
          <Text style={styles.badgeText}>Not Submitted</Text>
        </View>
      );
    }

    switch (assignment.mySubmission.status) {
      case 'draft':
        return (
          <View style={[styles.badge, styles.badgeDraft]}>
            <Text style={styles.badgeText}>Draft Saved</Text>
          </View>
        );
      case 'submitted':
        if (assignment.mySubmission.gradingStatus === 'pending') {
          return (
            <View style={[styles.badge, styles.badgePending]}>
              <Text style={styles.badgeText}>Pending Review</Text>
            </View>
          );
        }
        // Fall through to graded status
      case 'graded':
        if (assignment.mySubmission.gradingStatus === 'passed') {
          return (
            <View style={[styles.badge, styles.badgePassed]}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.badgeText, { color: '#10B981' }]}>Passed</Text>
            </View>
          );
        } else if (assignment.mySubmission.gradingStatus === 'failed') {
          return (
            <View style={[styles.badge, styles.badgeFailed]}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={[styles.badgeText, { color: '#EF4444' }]}>Failed</Text>
            </View>
          );
        }
        return null;
      default:
        return null;
    }
  };

  // Truncate instructions
  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        isOverdue && styles.cardOverdue,
      ]}
      onPress={onPress}
    >
      {/* Header with title and status */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {assignment.title}
          </Text>
          {isOverdue && (
            <View style={styles.overdueIndicator}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.overdueText}>Overdue</Text>
            </View>
          )}
        </View>
        {getStatusBadge()}
      </View>

      {/* Instructions preview */}
      <Text style={styles.instructions} numberOfLines={2}>
        {truncateText(assignment.instructions)}
      </Text>

      {/* Footer with due date and grade */}
      <View style={styles.footer}>
        <View style={styles.dueDateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={[styles.dueDate, isOverdue && styles.dueDateOverdue]}>
            {formatDueDate(assignment.dueDate)}
          </Text>
        </View>

        {assignment.mySubmission?.gradingStatus === 'passed' ||
         assignment.mySubmission?.gradingStatus === 'failed' ? (
          <View style={styles.feedbackIndicator}>
            {assignment.mySubmission.feedback && (
              <>
                <Ionicons name="chatbox-outline" size={16} color="#6B7280" />
                <Text style={styles.feedbackText}>Feedback available</Text>
              </>
            )}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#F9FAFB',
    borderColor: '#391D65',
  },
  cardOverdue: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  overdueText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeNotSubmitted: {
    backgroundColor: '#F3F4F6',
  },
  badgeDraft: {
    backgroundColor: '#FEF3C7',
  },
  badgePending: {
    backgroundColor: '#DBEAFE',
  },
  badgePassed: {
    backgroundColor: '#D1FAE5',
  },
  badgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  dueDateOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  feedbackIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default AssignmentCard;
