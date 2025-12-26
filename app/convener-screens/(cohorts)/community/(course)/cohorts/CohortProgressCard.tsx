import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useGetCohortProgress } from '@/api/cohorts/progressSummary';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';

interface CohortProgressCardProps {
  cohortId: number;
}

export const CohortProgressCard: React.FC<CohortProgressCardProps> = ({ cohortId }) => {
  const { data, isLoading, error } = useGetCohortProgress(cohortId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load progress.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Cohort Engagement</Text>
        <Ionicons name="stats-chart" size={20} color={colors.primary} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.iconBg}>
            <Ionicons name="people" size={20} color="#4B0082" />
          </View>
          <View>
            <Text style={styles.statValue}>{data?.member_count ?? 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.iconBg, { backgroundColor: '#E0F2F1' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#00695C" />
          </View>
          <View>
            <Text style={styles.statValue}>{data?.total_completed_lessons ?? 0}</Text>
            <Text style={styles.statLabel}>Lessons Done</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>Average Completion Rate</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${data?.average_completion_percentage ?? 0}%` }]} />
        </View>
        <Text style={styles.progressValue}>{data?.average_completion_percentage ?? 0}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressSection: {
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary || '#4B0082',
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
  },
});