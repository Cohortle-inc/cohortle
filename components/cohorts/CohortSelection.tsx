import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useGetCohortsByProgramme } from '@/api/cohorts/getCohortsByProgramme';
import { useJoinCohort } from '@/api/cohorts/joinCohort';
import { useJoinCohort as useJoinCohortByCode } from '@/api/cohorts/joinCohorts';
import { colors } from '@/utils/color';
import { useRouter } from 'expo-router';
import { useState } from 'react';

interface Cohort {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    max_members?: number;
    member_count?: number;
}

interface CohortSelectionProps {
    programmeId: number;
    onJoinSuccess?: () => void;
}

const CohortSelection = ({ programmeId, onJoinSuccess }: CohortSelectionProps) => {
    const router = useRouter();
    const { data: response, isLoading: isLoadingCohorts, error } = useGetCohortsByProgramme(programmeId);
    const joinCohortMutation = useJoinCohort();
    const joinByCodeMutation = useJoinCohortByCode();
    const [code, setCode] = useState('');

    const cohorts: Cohort[] = response?.cohorts || [];

    const handleJoin = (cohortId: number) => {
        joinCohortMutation.mutate(cohortId, {
            onSuccess: () => {
                if (onJoinSuccess) onJoinSuccess();
            },
        });
    };

    const handleJoinByCode = () => {
        if (!code.trim()) return;
        joinByCodeMutation.mutate(code, {
            onSuccess: () => {
                if (onJoinSuccess) onJoinSuccess();
            },
        });
    };

    if (isLoadingCohorts) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading available cohorts...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Failed to load cohorts.</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: Cohort }) => {
        const isFull = item.max_members && item.member_count && (item.member_count >= item.max_members);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cohortName}>{item.name}</Text>
                    <Text style={styles.members}>
                        {item.member_count || 0} / {item.max_members || '∞'} members
                    </Text>
                </View>

                <View style={styles.dates}>
                    <Text style={styles.dateText}>Start: {new Date(item.start_date).toLocaleDateString()}</Text>
                    <Text style={styles.dateText}>End: {new Date(item.end_date).toLocaleDateString()}</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.joinButton,
                        isFull ? styles.disabledButton : undefined,
                        joinCohortMutation.isPending ? styles.disabledButton : undefined
                    ]}
                    disabled={!!(isFull || joinCohortMutation.isPending)}
                    onPress={() => handleJoin(item.id)}
                >
                    {joinCohortMutation.isPending ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.joinButtonText}>
                            {isFull ? 'Full' : 'Join Cohort'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join a Cohort</Text>
            <Text style={styles.subtitle}>
                You must be a member of a cohort to access the modules in this programme.
            </Text>

            <FlatList
                data={cohorts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No active cohorts available for this programme.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    errorText: {
        color: 'red',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1F1F1F',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    listContent: {
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E3DDF9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cohortName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#391D65',
    },
    members: {
        fontSize: 14,
        color: '#666',
    },
    dates: {
        marginBottom: 16,
    },
    dateText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    joinButton: {
        backgroundColor: '#391D65',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    joinButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 24,
    },
    codeSection: {
        marginTop: 24,
        paddingTop: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E3DDF9',
        marginBottom: 24,
    },
    codeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1F1F1F',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E3DDF9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
});

export default CohortSelection;
