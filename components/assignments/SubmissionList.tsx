import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useGetSubmissions } from '@/hooks/api/useSubmissions';
import { Submission, GradingStatus } from '@/types/assignments';

interface SubmissionListProps {
  assignmentId: string;
  onSubmissionPress?: (submission: Submission) => void;
}

type FilterOption = 'all' | 'submitted' | 'not_submitted' | 'graded' | 'pending';

const SubmissionList: React.FC<SubmissionListProps> = ({
  assignmentId,
  onSubmissionPress,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

  const {
    data: submissions,
    isLoading,
    isError,
    error,
  } = useGetSubmissions(assignmentId);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!submissions) {
      return {
        total: 0,
        submitted: 0,
        notSubmitted: 0,
        graded: 0,
        pending: 0,
        passed: 0,
        failed: 0,
      };
    }

    const stats = {
      total: submissions.length,
      submitted: 0,
      notSubmitted: 0,
      graded: 0,
      pending: 0,
      passed: 0,
      failed: 0,
    };

    submissions.forEach((submission) => {
      if (submission.status === 'submitted' || submission.status === 'graded') {
        stats.submitted++;
      } else {
        stats.notSubmitted++;
      }

      if (submission.gradingStatus === 'pending') {
        stats.pending++;
      } else if (submission.gradingStatus === 'passed') {
        stats.graded++;
        stats.passed++;
      } else if (submission.gradingStatus === 'failed') {
        stats.graded++;
        stats.failed++;
      }
    });

    return stats;
  }, [submissions]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];

    switch (selectedFilter) {
      case 'submitted':
        return submissions.filter(
          (s) => s.status === 'submitted' || s.status === 'graded'
        );
      case 'not_submitted':
        return submissions.filter((s) => s.status === 'draft' || !s.submittedAt);
      case 'graded':
        return submissions.filter((s) => s.gradingStatus !== 'pending');
      case 'pending':
        return submissions.filter((s) => s.gradingStatus === 'pending');
      default:
        return submissions;
    }
  }, [submissions, selectedFilter]);

  // Format timestamp
  const formatTimestamp = (dateString: string | null): string => {
    if (!dateString) return 'Not submitted';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Get status badge
  const getStatusBadge = (submission: Submission) => {
    if (!submission.submittedAt) {
      return (
        <View style={[styles.badge, styles.badgeNotSubmitted]}>
          <Text style={styles.badgeText}>Not Submitted</Text>
        </View>
      );
    }

    if (submission.gradingStatus === 'pending') {
      return (
        <View style={[styles.badge, styles.badgePending]}>
          <Text style={styles.badgeText}>Pending</Text>
        </View>
      );
    }

    if (submission.gradingStatus === 'passed') {
      return (
        <View style={[styles.badge, styles.badgePassed]}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={[styles.badgeText, { color: '#10B981' }]}>Passed</Text>
        </View>
      );
    }

    if (submission.gradingStatus === 'failed') {
      return (
        <View style={[styles.badge, styles.badgeFailed]}>
          <Ionicons name="close-circle" size={14} color="#EF4444" />
          <Text style={[styles.badgeText, { color: '#EF4444' }]}>Failed</Text>
        </View>
      );
    }

    return null;
  };

  // Render submission item
  const renderSubmissionItem = ({ item }: { item: Submission }) => (
    <Pressable
      style={({ pressed }) => [
        styles.submissionItem,
        pressed && styles.submissionItemPressed,
      ]}
      onPress={() => onSubmissionPress?.(item)}
    >
      <View style={styles.submissionHeader}>
        <View style={styles.studentInfo}>
          {item.student?.avatar ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.student.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#6B7280" />
            </View>
          )}
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.student?.name || 'Unknown Student'}</Text>
            <Text style={styles.studentEmail}>{item.student?.email || ''}</Text>
          </View>
        </View>
        {getStatusBadge(item)}
      </View>

      <View style={styles.submissionFooter}>
        <View style={styles.timestampContainer}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.timestamp}>{formatTimestamp(item.submittedAt)}</Text>
        </View>
        {item.submittedAt && (
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        )}
      </View>
    </Pressable>
  );

  // Render filter button
  const renderFilterButton = (filter: FilterOption, label: string, count: number) => {
    const isSelected = selectedFilter === filter;

    return (
      <Pressable
        onPress={() => setSelectedFilter(filter)}
        style={({ pressed }) => [
          styles.filterChip,
          isSelected && styles.filterChipSelected,
          pressed && styles.filterChipPressed,
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.filterChipTextSelected,
          ]}
        >
          {label} ({count})
        </Text>
      </Pressable>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#391D65" />
        <Text style={styles.loadingText}>Loading submissions...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Submissions</Text>
        <Text style={styles.errorMessage}>
          {(error as any)?.message || 'An error occurred'}
        </Text>
      </View>
    );
  }

  // Empty state
  if (!submissions || submissions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Students Enrolled</Text>
        <Text style={styles.emptyMessage}>
          Students will appear here once they enroll in this cohort
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Statistics Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics.total}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics.submitted}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics.graded}</Text>
          <Text style={styles.statLabel}>Graded</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', statistics.total)}
        {renderFilterButton('submitted', 'Submitted', statistics.submitted)}
        {renderFilterButton('not_submitted', 'Not Submitted', statistics.notSubmitted)}
        {renderFilterButton('pending', 'Pending', statistics.pending)}
        {renderFilterButton('graded', 'Graded', statistics.graded)}
      </View>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <View style={styles.emptyFilterContainer}>
          <Ionicons name="filter-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyFilterTitle}>No submissions match this filter</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSubmissions}
          keyExtractor={(item) => item.id}
          renderItem={renderSubmissionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#391D65',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipSelected: {
    backgroundColor: '#391D65',
    borderColor: '#391D65',
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  submissionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submissionItemPressed: {
    backgroundColor: '#F9FAFB',
    borderColor: '#391D65',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#391D65',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 13,
    color: '#6B7280',
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
  submissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 13,
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyFilterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyFilterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
});

export default SubmissionList;
