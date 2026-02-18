import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Text } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetStudentAssignments } from '@/hooks/api/useAssignments';
import AssignmentCard from '@/components/assignments/AssignmentCard';
import { Assignment } from '@/types/assignments';
import ErrorBoundary from '@/components/ErrorBoundary';

type FilterOption = 'all' | 'pending' | 'passed' | 'failed';

const StudentAssignmentsScreen: React.FC = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

  const {
    data: assignments,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useGetStudentAssignments();

  // Sort assignments by due date (nearest first)
  const sortedAssignments = useMemo(() => {
    if (!assignments) return [];

    return [...assignments].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB; // Ascending order (nearest deadline first)
    });
  }, [assignments]);

  // Filter assignments by grading status
  const filteredAssignments = useMemo(() => {
    if (selectedFilter === 'all') {
      return sortedAssignments;
    }

    return sortedAssignments.filter((assignment) => {
      const gradingStatus = assignment.mySubmission?.gradingStatus;
      return gradingStatus === selectedFilter;
    });
  }, [sortedAssignments, selectedFilter]);

  // Count assignments by status
  const statusCounts = useMemo(() => {
    const counts = {
      all: sortedAssignments.length,
      pending: 0,
      passed: 0,
      failed: 0,
    };

    sortedAssignments.forEach((assignment) => {
      const status = assignment.mySubmission?.gradingStatus;
      if (status === 'pending') counts.pending++;
      else if (status === 'passed') counts.passed++;
      else if (status === 'failed') counts.failed++;
    });

    return counts;
  }, [sortedAssignments]);

  // Handle assignment card press
  const handleAssignmentPress = (assignment: Assignment) => {
    router.push(`/assignments/${assignment.id}` as any);
  };

  // Render filter button
  const renderFilterButton = (
    filter: FilterOption,
    label: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    const isSelected = selectedFilter === filter;
    const count = statusCounts[filter];

    return (
      <Pressable
        onPress={() => setSelectedFilter(filter)}
        style={({ pressed }) => [
          styles.filterButton,
          isSelected && styles.filterButtonSelected,
          pressed && styles.filterButtonPressed,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isSelected ? '#391D65' : '#6B7280'}
        />
        <Text
          style={[
            styles.filterButtonText,
            isSelected && styles.filterButtonTextSelected,
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.countBadge,
            isSelected && styles.countBadgeSelected,
          ]}
        >
          <Text
            style={[
              styles.countBadgeText,
              isSelected && styles.countBadgeTextSelected,
            ]}
          >
            {count}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#391D65" />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Assignments</Text>
        <Text style={styles.errorMessage}>
          {(error as any)?.message || 'An error occurred while loading assignments'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (!assignments || assignments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Assignments Yet</Text>
        <Text style={styles.emptyMessage}>
          Your assignments will appear here when your instructors create them
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Assignments</Text>
        <Text style={styles.headerSubtitle}>
          {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', 'list')}
        {renderFilterButton('pending', 'Pending', 'time')}
        {renderFilterButton('passed', 'Passed', 'checkmark-circle')}
        {renderFilterButton('failed', 'Failed', 'close-circle')}
      </View>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <View style={styles.emptyFilterContainer}>
          <Ionicons name="filter-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyFilterTitle}>No {selectedFilter} assignments</Text>
          <Text style={styles.emptyFilterMessage}>
            Try selecting a different filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AssignmentCard
              assignment={item}
              onPress={() => handleAssignmentPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#391D65"
              colors={['#391D65']}
            />
          }
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  filterButtonSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#391D65',
  },
  filterButtonPressed: {
    opacity: 0.7,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextSelected: {
    color: '#391D65',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeSelected: {
    backgroundColor: '#391D65',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  countBadgeTextSelected: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
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
    marginBottom: 8,
  },
  emptyFilterMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

// Wrap with error boundary
const StudentAssignmentsScreenWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <StudentAssignmentsScreen />
  </ErrorBoundary>
);

export default StudentAssignmentsScreenWithErrorBoundary;
