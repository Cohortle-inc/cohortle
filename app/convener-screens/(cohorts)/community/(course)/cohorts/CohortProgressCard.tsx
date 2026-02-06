import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/utils/color';

interface CohortProgressCardProps {
    cohortId: number;
}

const CohortProgressCard = ({ cohortId }: CohortProgressCardProps) => {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>Cohort Progress</Text>
            <Text style={styles.subtitle}>Cohort ID: {cohortId}</Text>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>0%</Text>
                    <Text style={styles.statLabel}>Completion</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Active Learners</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontFamily: 'DMSansBold',
        color: colors.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F1F1F',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
});

export default CohortProgressCard;
