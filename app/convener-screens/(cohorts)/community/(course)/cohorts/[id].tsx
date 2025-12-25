import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaWrapper } from '@/HOC';
import { NavHead } from '@/components/HeadRoute';
import { Text } from '@/theme/theme';
import { PlusSmall } from '@/assets/icons';
import { useGetCohortsByProgramme } from '@/api/cohorts/getCohortsByProgramme';
import { useCreateCohort } from '@/api/cohorts/postCohort';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';
import { showMessage } from 'react-native-flash-message';
import { colors } from '@/utils/color';
import { Ionicons } from '@expo/vector-icons';

const CohortList = () => {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const programmeId = Number(id);
    const router = useRouter();

    const [isModalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        max_members: '0',
    });

    const { data: cohortsResponse, isLoading } = useGetCohortsByProgramme(programmeId);
    const cohorts = cohortsResponse?.cohorts || [];

    const { mutate: createCohort, isPending } = useCreateCohort(programmeId);

    const handleCreateCohort = () => {
        if (!formData.name.trim() || !formData.description.trim()) {
            showMessage({
                message: 'Error',
                description: 'Please fill in required fields',
                type: 'danger',
            });
            return;
        }

        createCohort(
            {
                ...formData,
                max_members: Number(formData.max_members),
            },
            {
                onSuccess: () => {
                    setModalVisible(false);
                    setFormData({
                        name: '',
                        description: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date().toISOString().split('T')[0],
                        max_members: '0',
                    });
                },
            }
        );
    };

    const renderCohortItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.cohortItem}
            onPress={() =>
                router.push({
                    pathname: '/convener-screens/(cohorts)/community/(course)/cohorts/details/[id]',
                    params: { id: item.id, name: item.name },
                })
            }
        >
            <View style={styles.cohortIcon}>
                <Ionicons name="people-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cohortName}>{item.name}</Text>
                <Text style={styles.cohortDates}>
                    {item.start_date} - {item.end_date}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaWrapper>
            <NavHead text={`Cohorts - ${name}`} />

            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>All Cohorts</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <PlusSmall style={{ color: '#fff' }} />
                        <Text style={styles.addButtonText}>New Cohort</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : cohorts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No cohorts found for this programme.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={cohorts}
                        renderItem={renderCohortItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>

            <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create New Cohort</Text>
                    <Input
                        label="Cohort Name"
                        value={formData.name}
                        onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                        placeholder="e.g. Winter 2024"
                    />
                    <Input
                        label="Description"
                        value={formData.description}
                        onChangeText={(text: string) => setFormData({ ...formData, description: text })}
                        placeholder="Brief description"
                    />
                    <Input
                        label="Start Date (YYYY-MM-DD)"
                        value={formData.start_date}
                        onChangeText={(text: string) => setFormData({ ...formData, start_date: text })}
                    />
                    <Input
                        label="End Date (YYYY-MM-DD)"
                        value={formData.end_date}
                        onChangeText={(text: string) => setFormData({ ...formData, end_date: text })}
                    />
                    <Input
                        label="Max Members"
                        value={formData.max_members}
                        onChangeText={(text: string) => setFormData({ ...formData, max_members: text })}
                        keyboardType="numeric"
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, isPending && { opacity: 0.7 }]}
                        onPress={handleCreateCohort}
                        disabled={isPending}
                    >
                        <Text style={styles.submitButtonText}>
                            {isPending ? 'Creating...' : 'Create Cohort'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: { fontSize: 20, fontWeight: '700', color: '#1F1F1F' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    listContent: { paddingBottom: 20 },
    cohortItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
    },
    cohortIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.purpleShade,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cohortName: { fontSize: 16, fontWeight: '700', color: '#1F1F1F' },
    cohortDates: { fontSize: 12, color: '#666', marginTop: 4 },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#888', fontSize: 16 },
    modalContent: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        gap: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 32,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default CohortList;
